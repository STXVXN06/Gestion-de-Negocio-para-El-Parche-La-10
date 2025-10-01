package com.stxvxn.parchela10.servicios.emails;

public interface IEmailService {

    public void enviarFactura(String toEmail, String subject, String body);

}
