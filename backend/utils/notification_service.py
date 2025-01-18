from datetime import datetime, timedelta
import random
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from typing import Optional
import logging
from twilio.rest import Client
from sqlalchemy.orm import Session
from fastapi import HTTPException
from models import OTPVerification
from config import SMTP_SERVER, SMTP_PORT, SMTP_USERNAME, SMTP_PASSWORD, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, TWILIO_SERVICE_SID

# OTP configuration
OTP_EXPIRY_MINUTES = 10

class NotificationService:
    def __init__(self):
        self.email_client = None
        self.sms_client = Client(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN)
        
    def generate_otp(self) -> str:
        """Generate a 6-digit OTP"""
        return ''.join([str(random.randint(0, 9)) for _ in range(6)])

    async def send_email(self, to_email: str, subject: str, html_content: str) -> bool:
        """Send an email using SMTP"""
        try:
            msg = MIMEMultipart("alternative")
            msg["From"] = SMTP_USERNAME
            msg["To"] = to_email
            msg["Subject"] = subject
            msg.attach(MIMEText(html_content, "html"))

            with smtplib.SMTP(SMTP_SERVER, SMTP_PORT) as server:
                server.starttls()
                server.login(SMTP_USERNAME, SMTP_PASSWORD)
                server.send_message(msg)
            return True
        except Exception as e:
            logging.error(f"Error sending email: {str(e)}")
            return False

    async def send_sms(self, to_phone: str, message: str) -> bool:
        """Send an SMS using Twilio"""
        try:
            self.sms_client.messages.create(
                body=message,
                #from_=TWILIO_PHONE_NUMBER,
                to=to_phone,
                messaging_service_sid=TWILIO_SERVICE_SID
            )
            return True
        except Exception as e:
            logging.error(f"Error sending SMS: {str(e)}")
            return False

    async def send_otp_notification(
        self, 
        email: str, 
        phone: str, 
        notification_type: str = "verification",
        db: Optional[Session] = None
    ) -> dict:
        """
        Send OTP via both email and SMS
        notification_type can be: verification, password_reset, login, etc.
        """
        otp = self.generate_otp()
        expiry = datetime.utcnow() + timedelta(minutes=OTP_EXPIRY_MINUTES)
        
        # Email template
        email_subject = f"Your Myaje {notification_type.replace('_', ' ').title()} OTP"
        email_content = f"""
        <html>
            <body>
                <h2>Your OTP Code</h2>
                <p>Here is your one-time password for {notification_type}:</p>
                <h1>{otp}</h1>
                <p>This code will expire in {OTP_EXPIRY_MINUTES} minutes.</p>
                <p>If you didn't request this code, please ignore this message.</p>
            </body>
        </html>
        """
        
        # SMS template
        sms_content = f"Your {notification_type} OTP is: {otp}. Valid for {OTP_EXPIRY_MINUTES} minutes."

        # Send notifications
        email_sent = await self.send_email(email, email_subject, email_content)
        sms_sent = await self.send_sms(phone, sms_content)

        if not (email_sent or sms_sent):
            raise HTTPException(
                status_code=500,
                detail="Failed to send OTP via both email and SMS"
            )

        # Store OTP in database if db session is provided
        if db:
            otp_record = OTPVerification(
                email=email,
                phone=phone,
                otp=otp,
                expires_at=expiry,
                type=notification_type
            )
            db.add(otp_record)
            try:
                db.commit()
            except Exception as e:
                db.rollback()
                logging.error(f"Error storing OTP: {str(e)}")
                raise HTTPException(
                    status_code=500,
                    detail="Error storing OTP verification"
                )

        return {
            "message": "OTP sent successfully",
            "email_sent": email_sent,
            "sms_sent": sms_sent,
            "expires_at": expiry.isoformat()
        }

    async def verify_otp(
        self,
        email: str,
        phone: str,
        otp: str,
        notification_type: str,
        db: Session
    ) -> bool:
        """Verify the OTP provided by the user"""
        otp_record = db.query(OTPVerification).filter(
            OTPVerification.email == email,
            OTPVerification.phone == phone,
            OTPVerification.otp == otp,
            OTPVerification.type == notification_type,
            OTPVerification.expires_at > datetime.utcnow(),
            OTPVerification.used_at.is_(None)
        ).first()

        if not otp_record:
            return False

        # Mark OTP as used
        otp_record.used_at = datetime.utcnow()
        try:
            db.commit()
        except Exception as e:
            db.rollback()
            logging.error(f"Error updating OTP record: {str(e)}")
            raise HTTPException(
                status_code=500,
                detail="Error verifying OTP"
            )

        return True