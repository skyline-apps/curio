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

# IAM policy to allow sending emails
data "aws_iam_policy_document" "ses_sender" {
  statement {
    actions = [
      "ses:SendEmail",
      "ses:SendRawEmail"
    ]
    resources = [
      aws_ses_domain_identity.auth.arn,
      aws_ses_email_identity.auth.arn
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
}

resource "aws_iam_user_policy_attachment" "smtp_policy" {
  user       = aws_iam_user.smtp_user.name
  policy_arn = aws_iam_policy.ses_sender.arn
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
