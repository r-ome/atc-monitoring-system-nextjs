# MySQL

- RDS_ENDPOINT: `atc-monitoring-system-db.ctpgzuctxa9o.ap-southeast-1.rds.amazonaws.com`
- USER: admin
- PASSWORD: `zW5y9KA6UvDTQwc9wip3`

## Connecting to MySQL

1. Connect using EC2
2. type in command `mysql -h atc-monitoring-system-db.ctpgzuctxa9o.ap-southeast-1.rds.amazonaws.com -u admin -D atc_monitoring_system -p`
3. type in password `zW5y9KA6UvDTQwc9wip3`

## Run Prisma Migrations (From local to EC2 -> RDS)

1. Create an SSH tunnel using this command(must be in a separate terminal and must be open during the operation):

```
ssh -i ~/.ssh/./github_actions_deploy \
-N -L 3307:atc-monitoring-system-db.ctpgzuctxa9o.ap-southeast-1.rds.amazonaws.com:3306 \
deploy@ec2-13-213-17-123.ap-southeast-1.compute.amazonaws.com
```

2. type in command `cd <PROJECT_FOLDER>`
3. when currently in project folder type in these commands:

```
export DATABASE_URL="mysql://admin:zW5y9KA6UvDTQwc9wip3@127.0.0.1:3307/atc_monitoring_system"
npm ci
npx prisma migrate deploy
unset DATABASE_URL
```

## Creating SQL dumps from EC2(RDS) then copying it to local folder

1. Connect to EC2
2. type in command: (this creates a single .sql dump in the /var/www/atc-monitoring-system/dumps directory)

```
mysqldump \
  -h atc-monitoring-system-db.ctpgzuctxa9o.ap-southeast-1.rds.amazonaws.com \
  -u admin \
  -p \
  --single-transaction \
  --skip-lock-tables \
  --set-gtid-purged=OFF \
  atc_monitoring_system > /var/www/atc-monitoring-system/dumps/atc_monitoring_system-$(date +%F-%H%M%S).sql
```

3. type in command in local machine directory:

```
scp -i ~/.ssh/./github_actions_deploy \
  deploy@ec2-13-213-17-123.ap-southeast-1.compute.amazonaws.com:/var/www/atc-monitoring-system/dumps/atc_monitoring_system-2026-01-06-121109.sql \
  .
```

## Uploading dumps in MySQL

1. Connect to EC2
2. type in command `cd /var/www/atc-monitoring-system/dumps`
3. type in command

```
export MYSQL_PWD='zW5y9KA6UvDTQwc9wip3'
for f in *.sql; do
echo "importing $f"
mysql -u admin -h atc-monitoring-system-db.ctpgzuctxa9o.ap-southeast-1.rds.amazonaws.com -D atc_monitoring_system < "$f"
done
unset MYSQL_PWD
```

## Upload files to EC2

1. go to directory where file(s) is/are located
2. type in command `rsync -avz -e "ssh -i ~/.ssh/./github_actions_deploy" . deploy@ec2-13-213-17-123.ap-southeast-1.compute.amazonaws.com:/var/www/atc-monitoring-system/dumps`
   2.1 (details) `rsync`: synchronization tool: synchonizes the content of tw directores
   `-avz`: - `a`: archive mode - `v`: verbose - `z`: compression
   `-e "ssh -i ./github_actions_deploy"`: specifies the remote shell
   `.`: source or the current directory
   `deploy@ec2-13-213-17-123.ap-southeast-1.compute.amazonaws.com:/var/www/atc-monitoring-system/dumps`: destionation directory

# EC2

## Connecting to EC2

1. cd `~/.ssh`
   2.1 (using _deploy_ user) type in command `ssh -i ~/.ssh/./github_actions_deploy deploy@ec2-13-213-17-123.ap-southeast-1.compute.amazonaws.com`
   2.2 (using _ec2-user_) type in command `ssh -i "~/.ssh/atc-monitoring-system.pem" ec2-user@ec2-13-213-17-123.ap-southeast-1.compute.amazonaws.com`

## Restarting Server

1. Connect to EC2
2. type in command `pm2 restart 0`

## Checking/Update .env files

1. Connect to EC2
2. type in command `cd /var/www/atc-monitoring-system/shared`
3. cat `.env`
4. (update) sudo nano .env
   4.1. (to save) control(^) + o, enter, control(^) + x
