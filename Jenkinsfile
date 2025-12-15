// 1. We define this OUTSIDE the pipeline so it can be a real Object, not just a String
def dockerImage

pipeline {
  environment {
    dockerimagename = "shahzad885/express-backend"
    kubeconfigId = 'minikube-kubeconfig'
  }
  agent any
  stages {
    
    stage('Build image') {
      steps{
        script {
          // 2. We assign the build result to our variable (with --no-cache to force updates)
          dockerImage = docker.build(dockerimagename, "--no-cache .")
        }
      }
    }
    
    stage('Pushing Image') {
      steps{
        script {
          // 3. We use the ID 'dockerhub-credentials' directly since we saw it in your screenshot
          docker.withRegistry( 'https://registry.hub.docker.com', 'dockerhub-credentials' ) {
            dockerImage.push("latest")
          }
        }
      }
    }
    
    stage('Deploying to Kubernetes') {
      steps {
        // NOTE: This part will still fail because we haven't set up 'minikube-kubeconfig' yet.
        // We will fix this in the next step!
        withKubeConfig([credentialsId: kubeconfigId]) {
           sh 'kubectl apply -f deployment.yaml'
           sh 'kubectl apply -f service.yaml'
        }
      }
    }
  }
}