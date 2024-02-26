# OTP Generator using AWS CDK

This project demonstrates how to create a public S3 website using AWS CDK. The infrastructure is defined using TypeScript and AWS CDK, which allows for easy deployment and management of AWS resources.

## Prerequisites

Before you begin, ensure you have the following installed:

- Node.js and npm (Node Package Manager)
- AWS CDK Toolkit

## Installation

1. Clone this repository to your local machine:

   ```bash
   git clone <repository_url>
   ```
2. Navigate to the project directory:

   ```bash
   cd <cloned_folder>
   ```

3. Install the project dependencies:

   ```bash
    npm install
    ```

4. Bootstrap the AWS environment:
   ```bash
   npx cdk bootstrap aws://ACCOUNT-NUMBER/REGION
   ```

## Deployment
To deploy the website on AWS:

1. Configure your AWS credentials using the AWS CLI:

   ```bash
   aws configure
    ```

2. Deploy the website using AWS CDK, and add the OTP secret as a parameter:

   ```bash
   npx cdk deploy --parameters otpSecret=123
   ```

## Usage
Once deployed, the output of the deployment will include the URL of the hosted website. You can access the website using the provided URL.

## Cleanup
To avoid incurring charges, you can destroy the resources created by the stack:

```bash
cdk destroy
```
