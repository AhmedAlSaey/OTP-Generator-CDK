import json
import pyotp
import os

def main(event, context):
    # get secret from env variables
    secret = os.environ.get('OTP_SECRET')
    totp = pyotp.TOTP(secret)
    current_otp = totp.now()
    return {
        'statusCode': 200, 
        'body': json.dumps({
            'current_otp': current_otp
        }) 
    }