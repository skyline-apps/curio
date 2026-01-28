# SES configuration
resource "aws_ses_domain_identity" "auth" {
  domain = var.ses_email_identity_sender
}

resource "aws_ses_domain_dkim" "auth" {
  domain = aws_ses_domain_identity.auth.domain
}

resource "aws_ses_domain_mail_from" "auth" {
  domain                 = aws_ses_domain_identity.auth.domain
  mail_from_domain       = "amazonses.${aws_ses_domain_identity.auth.domain}"
  behavior_on_mx_failure = "RejectMessage"
}

# Create email identity for the specific address
resource "aws_ses_email_identity" "auth" {
  email = "auth@${var.ses_email_identity_sender}"
}

# Using the main receipt rule set from email_receiver.tf

resource "aws_ses_receipt_rule" "forward" {
  name          = "forward-sender-emails"
  rule_set_name = aws_ses_receipt_rule_set.main.rule_set_name
  enabled       = true
  scan_enabled  = true
  recipients    = [var.ses_email_identity_sender]

  # Forward action
  sns_action {
    topic_arn = aws_sns_topic.email_forwarder.arn
    position  = 1
  }
}

# SNS topic for email forwarding
resource "aws_sns_topic" "email_forwarder" {
  name = "${var.project_prefix}-${var.environment}-email-forwarder"
}

resource "aws_sns_topic_policy" "email_forwarder" {
  arn = aws_sns_topic.email_forwarder.arn
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSESPublish"
        Effect = "Allow"
        Principal = {
          Service = "ses.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.email_forwarder.arn
      }
    ]
  })
}

# SNS topic subscription for email forwarding
resource "aws_sns_topic_subscription" "email_forwarder" {
  topic_arn = aws_sns_topic.email_forwarder.arn
  protocol  = "email"
  endpoint  = var.project_forwarding_email_address
}

# IAM policy to allow sending emails
data "aws_iam_policy_document" "ses_sender" {
  statement {
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail"
    ]
    resources = [
      aws_ses_domain_identity.auth.arn,
      aws_ses_email_identity.auth.arn,
    ]
  }
}

resource "aws_iam_policy" "ses_sender" {
  name        = "ses-sender-policy"
  description = "Policy for sending emails through SES"
  policy      = data.aws_iam_policy_document.ses_sender.json
}

# IAM user for SMTP credentials
resource "aws_iam_user" "smtp_user" {
  name = "ses-smtp-user"
  lifecycle {
    ignore_changes = [
      tags,
      tags_all,
    ]
  }
}

resource "aws_iam_user_policy_attachment" "smtp_policy" {
  user       = aws_iam_user.smtp_user.name
  policy_arn = aws_iam_policy.ses_sender.arn
}

# Bounce Handling
resource "aws_sns_topic" "email_bounces" {
  name = "${var.project_prefix}-${var.environment}-email-bounces"
}

resource "aws_sns_topic_policy" "email_bounces" {
  arn = aws_sns_topic.email_bounces.arn
  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Sid    = "AllowSESPublish"
        Effect = "Allow"
        Principal = {
          Service = "ses.amazonaws.com"
        }
        Action   = "SNS:Publish"
        Resource = aws_sns_topic.email_bounces.arn
      }
    ]
  })
}

resource "aws_sns_topic_subscription" "email_bounces_webhook" {
  topic_arn = aws_sns_topic.email_bounces.arn
  protocol  = split(":", var.bounce_webhook_url)[0]
  endpoint  = var.bounce_webhook_url
  delivery_policy = jsonencode({
    "healthyRetryPolicy" : {
      "minDelayTarget" : 20,
      "maxDelayTarget" : 20,
      "numRetries" : 3,
      "numMaxDelayRetries" : 0,
      "numNoDelayRetries" : 0,
      "numMinDelayRetries" : 0,
      "backoffFunction" : "linear"
    },
    "throttlePolicy" : {
      "maxReceivesPerSecond" : 1
    },
    "requestPolicy" : {
      "headerContentType" : "application/json"
    }
  })
}

resource "aws_ses_identity_notification_topic" "bounce" {
  identity                 = aws_ses_domain_identity.auth.domain
  notification_type        = "Bounce"
  topic_arn                = aws_sns_topic.email_bounces.arn
  include_original_headers = true
}

# Outputs
output "ses_smtp_endpoint" {
  value = "email-smtp.${data.aws_region.current.name}.amazonaws.com"
}

output "ses_smtp_username" {
  value = aws_iam_user.smtp_user.name
}

output "smtp_instructions" {
  value = <<EOF
To get SMTP credentials:
1. Go to AWS Console > IAM > Users > ses-smtp-user
2. Create access keys (save these)
3. Convert the IAM credentials to SMTP credentials using the script/generate_smtp_password.py script

SMTP Settings:
- Server: email-smtp.${data.aws_region.current.name}.amazonaws.com
- Port: 587 (TLS) or 465 (SSL)
- Authentication: STARTTLS
EOF
}
