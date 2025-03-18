# Receiver Domain Verification Record
output "ses_receiver_verification_record" {
  description = "TXT record that needs to be added to receiver domain DNS settings to verify SES domain ownership"
  value = {
    name  = "_amazonses.${var.ses_email_identity_receiver}"
    type  = "TXT"
    value = aws_ses_domain_identity.main.verification_token
  }
}

# Receiver SPF Record
output "ses_receiver_spf_record" {
  description = "SPF record that needs to be added to receiver domain DNS settings"
  value = {
    name  = var.ses_email_identity_receiver
    type  = "TXT"
    value = "v=spf1 include:amazonses.com ~all"
  }
}

# Receiver DMARC Record
output "ses_receiver_dmarc_record" {
  description = "DMARC record that needs to be added to receiver domain DNS settings"
  value = {
    name  = "_dmarc.${var.ses_email_identity_receiver}"
    type  = "TXT"
    value = "v=DMARC1; p=quarantine; pct=100"
  }
}

# Receiver SES MX Records
output "ses_receiver_mx_records" {
  description = "MX records that need to be added to receiver domain DNS settings for receiving emails"
  value = [
    {
      name  = var.ses_email_identity_receiver
      type  = "MX"
      value = "10 inbound-smtp.${data.aws_region.current.name}.amazonaws.com"
    }
  ]
}

# Receiver SES DKIM Records
output "ses_receiver_dkim_records" {
  description = "CNAME records that need to be added to receiver domain DNS settings for DKIM verification"
  value = [
    for token in aws_ses_domain_dkim.main.dkim_tokens : {
      name  = "${token}._domainkey.${var.ses_email_identity_receiver}"
      type  = "CNAME"
      value = "${token}.dkim.amazonses.com"
    }
  ]
}

# Sender Domain Verification Record
output "ses_sender_verification_record" {
  description = "TXT record that needs to be added to sender domain DNS settings to verify SES domain ownership"
  value = {
    name  = "_amazonses.${var.ses_email_identity_sender}"
    type  = "TXT"
    value = aws_ses_domain_identity.auth.verification_token
  }
}

# Sender MAIL FROM DNS Records
output "ses_sender_mail_from_records" {
  description = "DNS records for the MAIL FROM domain"
  value = [
    {
      name  = aws_ses_domain_mail_from.auth.mail_from_domain
      type  = "MX"
      value = "10 feedback-smtp.${data.aws_region.current.name}.amazonses.com"
    },
    {
      name  = aws_ses_domain_mail_from.auth.mail_from_domain
      type  = "TXT"
      value = "v=spf1 include:amazonses.com -all"
    }
  ]
}

# Sender Receiving DNS Records
output "ses_sender_receiving_records" {
  description = "DNS records for receiving emails on the sender domain"
  value = [
    {
      name  = var.ses_email_identity_sender
      type  = "MX"
      value = "10 inbound-smtp.${data.aws_region.current.name}.amazonaws.com"
    },
    {
      name  = var.ses_email_identity_sender
      type  = "TXT"
      value = "v=spf1 include:amazonses.com -all"
    }
  ]
}

# Sender SPF Record
output "ses_sender_spf_record" {
  description = "SPF record that needs to be added to sender domain DNS settings"
  value = {
    name  = var.ses_email_identity_sender
    type  = "TXT"
    value = "v=spf1 include:amazonses.com ~all"
  }
}

# Sender DMARC Record
output "ses_sender_dmarc_record" {
  description = "DMARC record that needs to be added to sender domain DNS settings"
  value = {
    name  = "_dmarc.${var.ses_email_identity_sender}"
    type  = "TXT"
    value = "v=DMARC1; p=quarantine; pct=100; rua=mailto:dmarc-reports@${var.ses_email_identity_receiver}"
  }
}

# Sender SES DKIM Records
output "ses_sender_dkim_records" {
  description = "CNAME records that need to be added to sender domain DNS settings for DKIM verification"
  value = [
    for token in aws_ses_domain_dkim.auth.dkim_tokens : {
      name  = "${token}._domainkey.${var.ses_email_identity_sender}"
      type  = "CNAME"
      value = "${token}.dkim.amazonses.com"
    }
  ]
}

output "ses_sender_email_address" {
  description = "Email address verified to send from"
  value       = "auth@${var.ses_email_identity_sender}"
}

# S3 Bucket Name
output "email_storage_bucket" {
  description = "Name of the S3 bucket where emails will be stored"
  value       = aws_s3_bucket.email_storage.id
}
