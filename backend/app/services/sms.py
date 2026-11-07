import os


def send_sms(phone: str, message: str) -> None:
    test_mode = os.getenv("TEST_MODE", "true").lower() == "true"
    if test_mode:
        print(f"[TEST MODE] SMS to {phone}: {message}")
        return

    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_FROM_NUMBER")
    if not all((account_sid, auth_token, from_number)):
        print(f"[SMS] Missing Twilio configuration; SMS to {phone} was not sent: {message}")
        return

    from twilio.rest import Client
    Client(account_sid, auth_token).messages.create(body=message, from_=from_number, to=f"+91{phone}")
