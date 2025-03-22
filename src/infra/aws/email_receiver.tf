# SES configuration
resource "aws_ses_domain_identity" "main" {
  domain = var.ses_email_identity_receiver
}

resource "aws_ses_domain_dkim" "main" {
  domain = aws_ses_domain_identity.main.domain
}

resource "aws_ses_domain_mail_from" "main" {
  domain                 = aws_ses_domain_identity.main.domain
  mail_from_domain       = "amazonses.${aws_ses_domain_identity.main.domain}"
  behavior_on_mx_failure = "RejectMessage"
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
  recipients    = ["${var.ses_email_identity_receiver}"]

  # First store in S3
  s3_action {
    bucket_name       = aws_s3_bucket.email_storage.id
    object_key_prefix = "incoming/" # Add prefix for better organization
    position          = 1
  }
}
