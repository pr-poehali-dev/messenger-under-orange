import json
import os
import random
import string
import psycopg2
import urllib.request
import urllib.parse


def handler(event: dict, context) -> dict:
    """Отправляет SMS с кодом подтверждения на указанный номер телефона."""
    if event.get("httpMethod") == "OPTIONS":
        return {
            "statusCode": 200,
            "headers": {
                "Access-Control-Allow-Origin": "*",
                "Access-Control-Allow-Methods": "POST, OPTIONS",
                "Access-Control-Allow-Headers": "Content-Type",
                "Access-Control-Max-Age": "86400",
            },
            "body": "",
        }

    body = json.loads(event.get("body") or "{}")
    phone = body.get("phone", "").strip()

    if not phone:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Номер телефона обязателен"}),
        }

    # Нормализуем номер
    phone = "".join(filter(str.isdigit, phone))
    if len(phone) == 10:
        phone = "7" + phone
    if phone.startswith("8"):
        phone = "7" + phone[1:]
    if not phone.startswith("7") or len(phone) != 11:
        return {
            "statusCode": 400,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": "Неверный формат номера телефона"}),
        }
    phone = "+" + phone

    code = "".join(random.choices(string.digits, k=6))

    schema = os.environ.get("MAIN_DB_SCHEMA", "public")
    conn = psycopg2.connect(os.environ["DATABASE_URL"])
    cur = conn.cursor()

    # Удаляем старые неиспользованные коды для этого номера
    cur.execute(
        f"UPDATE {schema}.sms_codes SET used = TRUE WHERE phone = %s AND used = FALSE",
        (phone,),
    )

    # Создаём новый код
    cur.execute(
        f"INSERT INTO {schema}.sms_codes (phone, code) VALUES (%s, %s)",
        (phone, code),
    )
    conn.commit()
    cur.close()
    conn.close()

    # Отправляем SMS через sms.ru
    api_key = os.environ.get("SMS_API_KEY", "")
    sms_sent = False
    sms_error = ""

    if api_key:
        try:
            params = urllib.parse.urlencode({
                "api_id": api_key,
                "to": phone,
                "msg": f"Ваш код для входа в Андер: {code}",
                "json": 1,
            })
            url = f"https://sms.ru/sms/send?{params}"
            req = urllib.request.urlopen(url, timeout=10)
            resp = json.loads(req.read().decode())
            if resp.get("status") == "OK":
                sms_sent = True
            else:
                sms_error = resp.get("status_text", "Ошибка отправки")
        except Exception as e:
            sms_error = str(e)
    else:
        # Режим разработки — код в ответе
        return {
            "statusCode": 200,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({
                "success": True,
                "dev_code": code,
                "message": "Код отправлен (режим разработки)",
            }),
        }

    if not sms_sent:
        return {
            "statusCode": 500,
            "headers": {"Access-Control-Allow-Origin": "*"},
            "body": json.dumps({"error": f"Не удалось отправить SMS: {sms_error}"}),
        }

    return {
        "statusCode": 200,
        "headers": {"Access-Control-Allow-Origin": "*"},
        "body": json.dumps({"success": True, "message": "SMS отправлен"}),
    }
