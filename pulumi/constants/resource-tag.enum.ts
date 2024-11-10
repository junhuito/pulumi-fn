export enum ResourceTag {
    SQS = 'AWS::SQS::Queue',
    IAM = 'AWS::IAM::Role',
    LAMBDA = 'AWS::Lambda::Function',
    S3 = 'AWS::S3::Bucket',
    SSM = 'AWS::SSM::Parameter',
    STATE_MACHINE = 'AWS::StepFunctions::StateMachine',
    SECURITY_GROUP = 'AWS::EC2::SecurityGroup',
    ALARM = 'AWS::CloudWatch::Alarm',
}
