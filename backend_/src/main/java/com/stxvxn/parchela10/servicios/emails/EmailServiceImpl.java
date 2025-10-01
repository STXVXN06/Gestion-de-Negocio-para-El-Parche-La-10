package com.stxvxn.parchela10.servicios.emails;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.mail.javamail.JavaMailSender;
import org.springframework.mail.javamail.MimeMessageHelper;
import org.springframework.stereotype.Service;

import jakarta.mail.MessagingException;
import jakarta.mail.internet.MimeMessage;

@Service
public class EmailServiceImpl implements IEmailService {

    @Autowired
    private JavaMailSender mailSender;

    public void enviarFactura(String toEmail, String subject, String body) {
        try {
            MimeMessage message = mailSender.createMimeMessage();
            MimeMessageHelper helper = new MimeMessageHelper(message, true, "UTF-8");

            helper.setFrom("parchela10@example.com");
            helper.setTo(toEmail);
            helper.setSubject(subject);
            helper.setText(body, true); // true indica que es HTML

            mailSender.send(message);
        } catch (MessagingException e) {
            throw new RuntimeException("Error enviando email: " + e.getMessage());
        }
    }
}