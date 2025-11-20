# CI/CD Pipeline Setup Guide

This guide explains how to set up the CI/CD pipeline for deploying the Kanban Board System to an EC2 instance.

## Overview

The pipeline consists of two workflows:
1. **CI (Continuous Integration)**: Builds and tests on every push/PR to main
   - Runs Docker builds with test stage for server and client
   - Only builds production images on main branch
   - Uploads production images as artifacts for deployment
2. **CD (Continuous Deployment)**: Deploys to EC2 only after successful CI on main branch
   - Triggered automatically when CI workflow completes on main
   - Can also be triggered manually via workflow_dispatch
   - Includes health checks and rollback capability

## Prerequisites

### 1. EC2 Instance Setup

Your EC2 instance needs:
- Docker and Docker Compose installed
- SSH access enabled
- Security group allowing:
  - Port 22 (SSH)
  - Port 8080 (Server/GraphQL)
  - Port 3000 (Client/Next.js)
  - Port 5432 (PostgreSQL - if external access needed)

#### Install Docker on EC2 (Amazon Linux 2023):

```bash
# Update system
sudo yum update -y

# Install Docker
sudo yum install -y docker

# Start Docker service
sudo systemctl start docker
sudo systemctl enable docker

# Add user to docker group
sudo usermod -aG docker $USER

# Install Docker Compose
sudo curl -L "https://github.com/docker/compose/releases/latest/download/docker-compose-$(uname -s)-$(uname -m)" -o /usr/local/bin/docker-compose
sudo chmod +x /usr/local/bin/docker-compose

# Verify installation
docker --version
docker-compose --version

# Log out and back in for group changes to take effect
```

#### Create project directory on EC2:

```bash
mkdir -p /home/$USER/kanban-board-system
cd /home/$USER/kanban-board-system
```

### 2. GitHub Secrets Configuration

Add the following secrets to your GitHub repository:
(`Settings` → `Secrets and variables` → `Actions` → `New repository secret`)

| Secret Name | Description | Example |
|-------------|-------------|---------|
| `AWS_ACCESS_KEY_ID` | AWS access key for authentication | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS secret key | `wJalrXUtnFEMI/K7MDENG/bPxRfiCYEXAMPLEKEY` |
| `AWS_REGION` | AWS region where EC2 is located | `us-east-1` |
| `EC2_HOST` | Public IP or DNS of EC2 instance | `ec2-XX-XX-XX-XX.compute.amazonaws.com` |
| `EC2_USER` | SSH username for EC2 | `ec2-user` (Amazon Linux) or `ubuntu` (Ubuntu) |
| `EC2_SSH_KEY` | Private SSH key for EC2 access | Contents of your `.pem` file |
| `POSTGRES_USER` | PostgreSQL username | `kanban` |
| `POSTGRES_PASSWORD` | PostgreSQL password | `your_secure_password_here` |
| `POSTGRES_DB` | PostgreSQL database name | `kanban_db` |

#### How to get EC2_SSH_KEY:
```bash
# Display your private key
cat ~/.ssh/your-key.pem

# Copy the entire output including:
# -----BEGIN RSA PRIVATE KEY-----
# ... key content ...
# -----END RSA PRIVATE KEY-----
```

### 3. Environment Variables (Production)

The CD workflow automatically creates a `.env.production` file from GitHub Secrets during deployment.

**Required GitHub Secrets for production .env:**
- `POSTGRES_USER`
- `POSTGRES_PASSWORD`
- `POSTGRES_DB`
- `EC2_HOST` (used for API URLs)

The generated `.env.production` includes:
```env
NODE_ENV=production
SERVER_PORT=8080
NEXT_PUBLIC_API_URL=http://<EC2_HOST>:8080
NEXT_PUBLIC_GRAPHQL_URL=http://<EC2_HOST>:8080/graphql
POSTGRES_USER=<from_secret>
POSTGRES_PASSWORD=<from_secret>
POSTGRES_DB=<from_secret>
DATABASE_URL=postgresql://<user>:<pass>@postgresql:5432/<db>
```

**For local development**, create a `.env` file:

```env
# Node Environment
NODE_ENV=development

# Server Configuration
SERVER_PORT=8080

# Client Configuration
NEXT_PUBLIC_API_URL=http://localhost:8080
NEXT_PUBLIC_GRAPHQL_URL=http://localhost:8080/graphql

# PostgreSQL Configuration
POSTGRES_USER=kanban
POSTGRES_PASSWORD=kanban_pass
POSTGRES_DB=kanban_db
DATABASE_URL=postgresql://kanban:kanban_pass@postgresql:5432/kanban_db
```

**⚠️ Important**: Never commit `.env` or `.env.production` files with sensitive data.

## Pipeline Workflow

### Trigger Conditions

**CI Workflow** (`ci.yml`) runs on:
- **Push to main branch**: Builds, tests, and creates production images
- **Pull requests to main**: Builds and tests only (no production images)

**CD Workflow** (`cd.yml`) runs on:
- **After successful CI on main branch**: Automatically deploys to EC2
- **Manual trigger**: Via workflow_dispatch for on-demand deployment

### Pipeline Steps

#### Workflow 1: CI - Build and Test
1. **Checkout code**
2. **Build and test in Docker containers**:
   - Build `builder` stage for server (compile TypeScript)
   - Build `test` stage for server (run Jest tests)
   - Build `builder` stage for client (Next.js build)
   - Build `test` stage for client (run Jest tests)
3. **Build production images** (only on main branch):
   - Build `production` stage for server
   - Build `production` stage for client
4. **Save Docker images** as `.tar` files
5. **Upload artifacts** (retention: 1 day)

#### Workflow 2: CD - Deploy to EC2
1. **Checkout code**
2. **Create production .env file** from GitHub Secrets
3. **Download build artifacts** (Docker images)
4. **Configure AWS credentials**
5. **Setup SSH** with EC2 key
6. **Copy files to EC2** via SCP:
   - Docker image tarballs
   - `docker-compose.yml`
   - `.env` file (generated from secrets)
7. **Deploy on EC2** via SSH:
   - Load Docker images from tarballs
   - Tag images for backup/rollback
   - Stop old containers with `docker-compose down`
   - Start new containers with `docker-compose up -d`
   - Clean up temporary files
8. **Health checks**:
   - Wait for services to initialize
   - Check container status with `docker-compose ps`
   - Verify server responds on port 8080
   - Verify client responds on port 3000
   - Check PostgreSQL with `pg_isready`
9. **Cleanup old Docker images**
10. **Deployment summary** with service URLs

**Rollback Job** (manual trigger only):
- Runs if deployment fails on manual workflow_dispatch
- Restores previous Docker image tags
- Restarts containers with old images

## Manual Deployment

You can also deploy manually using the provided script:

```bash
# On your EC2 instance
cd /home/$USER/kanban-board-system

# Make script executable
chmod +x deploy.sh

# Run deployment
./deploy.sh
```

## Monitoring and Troubleshooting

### View GitHub Actions logs:
1. Go to your repository on GitHub
2. Click on `Actions` tab
3. Select the workflow run
4. Click on job to see detailed logs

### Check container status on EC2:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-host

# Check running containers
docker-compose ps

# View logs
docker-compose logs -f

# View specific service logs
docker-compose logs -f server
docker-compose logs -f client
docker-compose logs -f postgresql

# Check service health
curl http://localhost:8080/
curl http://localhost:3000/
```

### Common Issues

#### 1. Workflow Scope Error When Pushing
**Error**: `refusing to allow a Personal Access Token to create or update workflow .github/workflows/*.yml without workflow scope`

**Solution**: Create a new PAT with `workflow` scope:
- Go to GitHub Settings → Developer settings → Personal access tokens
- Generate new token with `repo` + `workflow` scopes
- Update your Git credentials with the new PAT

#### 2. SSH Connection Failed
- Verify EC2 security group allows SSH (port 22)
- Check `EC2_SSH_KEY` secret is correct (include BEGIN/END markers)
- Verify `EC2_HOST` and `EC2_USER` are correct

#### 3. Tests Failing
- Run tests locally first: `docker build --target test -f server/Dockerfile .`
- Check GitHub Actions logs for specific test failures
- Verify mock configurations match repository method signatures

#### 4. Deployment Failed
- Check EC2 disk space: `df -h`
- Verify Docker is running: `sudo systemctl status docker`
- Check Docker Compose is installed: `docker-compose --version`
- Review CD workflow logs for specific error messages

#### 5. Services Not Responding
- Check container logs: `docker-compose logs`
- Verify ports are not blocked by firewall/security groups
- Check environment variables are set correctly in `.env`
- Verify DATABASE_URL format is correct

#### 6. Database Connection Issues
- Check PostgreSQL container is running: `docker-compose ps postgresql`
- Verify DATABASE_URL matches postgres container config
- Check Prisma migrations ran: `docker-compose logs server | grep prisma`
- Test connection: `docker-compose exec postgresql pg_isready -U kanban`

## Rollback Procedure

### Automatic Rollback (Manual Workflow Dispatch)

If you manually trigger deployment and it fails, the rollback job runs automatically:
1. Goes to GitHub Actions
2. Click "CD - Deploy to EC2" workflow
3. Click "Run workflow"
4. If deployment fails, rollback runs automatically

### Manual Rollback on EC2

If you need to manually rollback:

```bash
# SSH into EC2
ssh -i your-key.pem ec2-user@your-ec2-host

cd /home/$USER/kanban-board-system

# Rollback to previous Docker images
docker tag kanban-server:previous kanban-server:latest
docker tag kanban-client:previous kanban-client:latest

# Restart with old images
docker-compose down
docker-compose up -d

# Verify services
docker-compose ps
curl http://localhost:8080/
curl http://localhost:3000/
```

### Git-based Rollback

Revert to a previous commit and redeploy:

```bash
# On your local machine
git log --oneline  # Find the commit hash to rollback to
git revert <commit-hash>
git push origin main

# CI/CD will automatically deploy the reverted version
```

## Security Best Practices

1. **Never commit sensitive data**: Use GitHub Secrets for all credentials
2. **Rotate SSH keys regularly**: Update `EC2_SSH_KEY` secret periodically
3. **Use IAM roles**: Consider using EC2 IAM roles instead of AWS access keys
4. **Enable HTTPS**: Use reverse proxy (nginx) with SSL certificates in production
5. **Restrict security groups**: Only allow necessary IPs and ports
6. **Use secrets management**: Consider AWS Secrets Manager or HashiCorp Vault

## Optimization Tips

1. **Use Docker image caching**: GitHub Actions caches Docker layers
2. **Parallel builds**: Tests run in parallel for faster pipeline
3. **Artifact retention**: Set to 1 day to save storage
4. **Health checks**: Verify services before marking deployment successful

## Next Steps

- [ ] Set up HTTPS with Let's Encrypt
- [ ] Configure monitoring (CloudWatch, Prometheus)
- [ ] Add database backup automation
- [ ] Set up staging environment
- [ ] Implement blue-green deployment
- [ ] Add smoke tests after deployment
- [ ] Configure CDN for static assets

## Support

For issues or questions:
1. Check GitHub Actions logs
2. Review EC2 container logs
3. Verify all secrets are configured correctly
4. Check EC2 security group and network settings
