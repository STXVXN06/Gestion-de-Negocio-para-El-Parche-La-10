package com.stxvxn.parchela10;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication
public class Parchela10Application {

	public static void main(String[] args) {
		SpringApplication.run(Parchela10Application.class, args);

		System.out.println("DB_USER = " + System.getenv("DB_USER"));
		System.out.println("DB_PASSWORD = " + System.getenv("DB_PASSWORD"));

	}

}
