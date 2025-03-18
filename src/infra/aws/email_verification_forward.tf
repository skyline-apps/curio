# Uncomment and set your email to receive the verification email for auth@no-reply.curi.ooo
# locals {
#   forward_email = "yourpersonal@email.com" # Set this to your email address
# }

# # Configure domain for receiving emails
# resource "aws_ses_domain_identity" "sender_receive" {
#   domain = var.ses_email_identity_sender
# }

# resource "aws_ses_domain_mail_from" "sender_receive" {
#   domain           = aws_ses_domain_identity.sender_receive.domain
#   mail_from_domain = "mail.${aws_ses_domain_identity.sender_receive.domain}"
# }

# # Temporary rule set for forwarding verification email
# resource "aws_ses_receipt_rule_set" "temp_forward" {
#   rule_set_name = "temp-forward"
# }

# resource "aws_ses_active_receipt_rule_set" "temp_forward" {
#   rule_set_name = aws_ses_receipt_rule_set.temp_forward.rule_set_name
# }

# resource "aws_ses_receipt_rule" "forward" {
#   name          = "forward-verification"
#   rule_set_name = aws_ses_receipt_rule_set.temp_forward.rule_set_name
#   recipients    = [aws_ses_email_identity.auth.email]
#   enabled       = true
#   scan_enabled  = true

#   add_header_action {
#     header_name  = "X-Forwarded-For"
#     header_value = aws_ses_email_identity.auth.email
#     position     = 1
#   }

#   sns_action {
#     topic_arn = aws_sns_topic.email_forward.arn
#     position  = 2
#   }

#   stop_action {
#     scope    = "RuleSet"
#     position = 3
#   }
# }

# # SNS topic for email forwarding
# resource "aws_sns_topic" "email_forward" {
#   name = "ses-forward-verification"
# }

# resource "aws_sns_topic_policy" "email_forward" {
#   arn = aws_sns_topic.email_forward.arn
#   policy = jsonencode({
#     Version = "2012-10-17"
#     Statement = [
#       {
#         Sid    = "AllowSESPublish"
#         Effect = "Allow"
#         Principal = {
#           Service = "ses.amazonaws.com"
#         }
#         Action   = "SNS:Publish"
#         Resource = aws_sns_topic.email_forward.arn
#       }
#     ]
#   })
# }

# # SNS subscription to forward to your email
# resource "aws_sns_topic_subscription" "email_forward" {
#   topic_arn = aws_sns_topic.email_forward.arn
#   protocol  = "email"
#   endpoint  = local.forward_email
# }
