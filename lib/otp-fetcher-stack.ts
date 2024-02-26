// Importing necessary modules from AWS CDK library
import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";
import { BlockPublicAccess, Bucket, BucketAccessControl } from "aws-cdk-lib/aws-s3";
import { BucketDeployment, Source } from "aws-cdk-lib/aws-s3-deployment";
import { S3Origin } from "aws-cdk-lib/aws-cloudfront-origins";
import { Distribution, OriginAccessIdentity } from "aws-cdk-lib/aws-cloudfront";
import {
  Function,
  Runtime,
  Code,
  FunctionUrlAuthType,
} from "aws-cdk-lib/aws-lambda";
import { PythonFunction } from "@aws-cdk/aws-lambda-python-alpha";
import * as ejs from "ejs";
import * as path from "path";
import * as fs from "fs";
import { HttpMethod } from "aws-cdk-lib/aws-events";
import { AnyPrincipal, Effect, PolicyStatement } from "aws-cdk-lib/aws-iam";

// Defining the stack for OTP Fetcher application
export class OtpFetcherStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // Setting up prefix for resource naming (will be used for all resources except CfnParameter
    // to ensure variable name does not change)
    const idPrefix = "otp-fetcher";

    // Creating a CloudFormation parameter for OTP secret
    const otpSecret = new cdk.CfnParameter(this, `otpSecret`, {
      type: "String",
      description: "OTP secret to be returned.",
    });

    // Creating a Python Lambda function that will return the OTP according to the secret
    const lambdaFunction = new PythonFunction(this, "lambda-function", {
      entry: path.join(__dirname, "../src/"),
      index: "function.py",
      handler: "main",
      runtime: Runtime.PYTHON_3_12,
      environment: {
        OTP_SECRET: otpSecret.valueAsString, // Passing OTP secret as environment variable
      },
    });

    // Generating URL for Lambda function with no authentication required. This URL will be used
    // in a website to fetch OTP (see below)
    const lambdaUrl = lambdaFunction.addFunctionUrl({
      authType: FunctionUrlAuthType.NONE,
      cors: {
        allowedOrigins: ["*"], // Allowing CORS from any origin
        allowedMethods: [HttpMethod.GET], // Allowing only GET method
      },
    });

    // Creating an S3 bucket for hosting website content
    const bucket = new Bucket(this, `${idPrefix}-bucket`, {
      versioned: true,
      publicReadAccess: true,
      blockPublicAccess: BlockPublicAccess.BLOCK_ACLS,
      accessControl: BucketAccessControl.BUCKET_OWNER_FULL_CONTROL
    });

    // Allow public access to all objects in the bucket
    bucket.addToResourcePolicy(new PolicyStatement({
      actions: ['s3:GetObject'],
      effect: Effect.ALLOW,
      principals: [new AnyPrincipal()],
      resources: [bucket.arnForObjects('*')],
    }));

    // Reading and rendering the HTML template for website. The template will embed the lamda function
    // URL in it to fetch the OTP
    const templateBuffer = fs.readFileSync(path.join(__dirname, "../dist/index.ejs"), "utf-8");
    const renderedTemplate = ejs.render(templateBuffer.toString(), { functionUrl: lambdaUrl.url });

    // Deploying the rendered HTML template to the S3 bucket
    new BucketDeployment(this, `${idPrefix}-bucket-deployment`, {
      destinationBucket: bucket,
      sources: [Source.data('index.html', renderedTemplate)],
      
    });


    // Outputting CloudFront distribution domain name
    new cdk.CfnOutput(this, `${idPrefix}-bucket-url`, {
      value: `http://${bucket.bucketRegionalDomainName}`,

    });

    // Outputting the URL of the Lambda function
    new cdk.CfnOutput(this, `${idPrefix}-function-url`, {
      value: lambdaUrl.url,
    });
  }
}
