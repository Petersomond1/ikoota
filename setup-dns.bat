@echo off
echo Creating Route 53 DNS records...

echo Creating staging.ikoota.com A record...
aws route53 change-resource-record-sets ^
  --hosted-zone-id Z0260120XORMFLY6E7VU ^
  --change-batch "{ \"Changes\": [{ \"Action\": \"CREATE\", \"ResourceRecordSet\": { \"Name\": \"staging.ikoota.com\", \"Type\": \"A\", \"AliasTarget\": { \"DNSName\": \"ikoota-alb-517834808.us-east-1.elb.amazonaws.com\", \"EvaluateTargetHealth\": true, \"HostedZoneId\": \"Z35SXDOTRQ7X7K\" } } }] }"

echo.
echo Creating api.staging.ikoota.com A record...
aws route53 change-resource-record-sets ^
  --hosted-zone-id Z0260120XORMFLY6E7VU ^
  --change-batch "{ \"Changes\": [{ \"Action\": \"CREATE\", \"ResourceRecordSet\": { \"Name\": \"api.staging.ikoota.com\", \"Type\": \"A\", \"AliasTarget\": { \"DNSName\": \"ikoota-alb-517834808.us-east-1.elb.amazonaws.com\", \"EvaluateTargetHealth\": true, \"HostedZoneId\": \"Z35SXDOTRQ7X7K\" } } }] }"

echo DNS records created!