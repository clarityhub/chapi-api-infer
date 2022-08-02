# Clarity Hub Infer API

## Prerequisites

Make sure you have Clarity Hub API Gateway installed and running.

## 🚀 Getting Started

Make sure you have Docker installed and running

```bash
sh ./start.sh
```

You can now access the following:

* DynamoDB Shell: http://localhost:8020/shell/
* API: `GET https://api.clarityhub.app/infer/health`

## Authentication

The Clarity Hub Infer API uses Basic Authorization. Every API
request must contain an Authorize HTTP header with an encoded token.

Access tokens are specific to your user.

```bash
$ curl \
  -H 'Authorization: Basic ${encode(username:password)}' \
  -H 'Content-Type: application/json' \
  -X POST \
  -d "@conversation.txt" \
  'https://api.clarityhub.io/infer
```

Normally, you will use "Basic Auth" where the user name is your API Access Key ID and you password is the API Acess Key Secret.

**On local, your password must be your Organization ID. Local development will skip the Authorization check and pass through the Organization ID as if it checked your key.**

## Serverless Resources

## API

See `https://api.clarityhub.app/infer/swagger` for the Swagger API.
