# S3 bucket for storing email contents
resource "aws_s3_bucket" "email_storage" {
  bucket = "${var.project_prefix}-${var.environment}-email-storage"
}

# Allow SES to write to the S3 bucket
resource "aws_s3_bucket_policy" "allow_ses" {
  bucket = aws_s3_bucket.email_storage.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSESPuts"
        Effect = "Allow"
        Principal = {
          Service = "ses.amazonaws.com"
        }
        Action   = "s3:PutObject"
        Resource = "${aws_s3_bucket.email_storage.arn}/*"
        Condition = {
          StringEquals = {
            "AWS:SourceAccount" = data.aws_caller_identity.current.account_id
          }
        }
      }
    ]
  })
}

resource "aws_s3_bucket_lifecycle_configuration" "email_storage" {
  bucket = aws_s3_bucket.email_storage.id

  rule {
    id     = "cleanup"
    status = "Enabled"

    filter {
      prefix = "" # Apply to all objects
    }

    expiration {
      days = 1 # Delete emails after 1 day as they're processed immediately
    }
  }
}

# Get current AWS account ID
data "aws_caller_identity" "current" {}

# SES configuration
resource "aws_ses_domain_identity" "main" {
  domain = var.ses_email_identity
}

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

# Enable receiving on the domain
resource "aws_ses_receipt_filter" "main" {
  name   = "${var.project_prefix}-${var.environment}-filter"
  cidr   = "0.0.0.0/0"
  policy = "Allow"
}

resource "aws_ses_receipt_rule_set" "main" {
  rule_set_name = "${var.project_prefix}-${var.environment}-rules"
}

resource "aws_ses_active_receipt_rule_set" "main" {
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
}

resource "aws_ses_receipt_rule" "store_and_notify" {
  name          = "store-and-notify"
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
  enabled       = true
  scan_enabled  = true

  # First store in S3
  s3_action {
    bucket_name       = aws_s3_bucket.email_storage.id
    object_key_prefix = "incoming/" # Add prefix for better organization
    position          = 1
  }

  # Then notify SNS
  sns_action {
    topic_arn = aws_sns_topic.email_notifications.arn
    encoding  = "UTF-8" # Ensure proper encoding
    position  = 2
  }
}

# Lambda function
data "archive_file" "lambda_zip" {
  type        = "zip"
  output_path = "${path.module}/lambda.zip"

  source {
    filename = "index.js"
    content  = file("${path.module}/lambda/email_processor.js")
  }
}

resource "aws_lambda_function" "email_processor" {
  filename         = data.archive_file.lambda_zip.output_path
  source_code_hash = data.archive_file.lambda_zip.output_base64sha256
  function_name    = "${var.project_prefix}-${var.environment}-email-processor"
  role             = aws_iam_role.lambda_role.arn
  handler          = "index.handler"
  runtime          = "nodejs18.x"

  environment {
    variables = {
      API_ENDPOINT             = var.api_endpoint
      VERCEL_PROTECTION_BYPASS = var.vercel_protection_bypass
      CURIO_APP_SECRET         = var.curio_app_secret
      S3_BUCKET_NAME           = aws_s3_bucket.email_storage.id
      S3_OBJECT_PREFIX         = "incoming/"
    }
  }
}

# IAM role for Lambda
resource "aws_iam_role" "lambda_role" {
  name = "${var.project_prefix}-${var.environment}-lambda-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "lambda.amazonaws.com"
        }
      }
    ]
  })
}

# Lambda permissions
resource "aws_iam_role_policy" "lambda_policy" {
  name = "${var.project_prefix}-${var.environment}-lambda-policy"
  role = aws_iam_role.lambda_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "s3:GetObject",
          "s3:DeleteObject"
        ]
        Resource = ["${aws_s3_bucket.email_storage.arn}/*"]
      },
      {
        Effect   = "Allow"
        Action   = "s3:ListBucket"
        Resource = [aws_s3_bucket.email_storage.arn]
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = ["arn:aws:logs:*:*:*"]
      }
    ]
  })
}

# Configure SNS topic with delivery status logging
resource "aws_sns_topic" "email_notifications" {
  name                                = "${var.project_prefix}-${var.environment}-email-notifications"
  lambda_success_feedback_sample_rate = 0
  lambda_success_feedback_role_arn    = aws_iam_role.sns_feedback_role.arn
  lambda_failure_feedback_role_arn    = aws_iam_role.sns_feedback_role.arn
}

# IAM role for SNS delivery status logging
resource "aws_iam_role" "sns_feedback_role" {
  name = "${var.project_prefix}-${var.environment}-sns-feedback-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Action = "sts:AssumeRole"
        Effect = "Allow"
        Principal = {
          Service = "sns.amazonaws.com"
        }
      }
    ]
  })
}

# IAM policy for SNS delivery status logging
resource "aws_iam_role_policy" "sns_feedback_policy" {
  name = "${var.project_prefix}-${var.environment}-sns-feedback-policy"
  role = aws_iam_role.sns_feedback_role.id

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents",
          "logs:PutMetricFilter",
          "logs:PutRetentionPolicy"
        ]
        Resource = ["arn:aws:logs:*:*:*"]
      }
    ]
  })
}

# SNS Lambda Permission
resource "aws_lambda_permission" "sns" {
  statement_id  = "AllowSNSInvoke"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.email_processor.function_name
  principal     = "sns.amazonaws.com"
  source_arn    = aws_sns_topic.email_notifications.arn
}

# SNS Lambda Subscription
resource "aws_sns_topic_subscription" "lambda" {
  topic_arn = aws_sns_topic.email_notifications.arn
  protocol  = "lambda"
  endpoint  = aws_lambda_function.email_processor.arn
}
