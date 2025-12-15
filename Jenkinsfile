pipeline {
  environment {
    // REPLACE THIS with your actual DockerHub username
    dockerimagename = "shahzad885/express-backend"
    dockerImage = ""
    kubeconfigId = 'minikube-kubeconfig'
  }
  agent any
  stages {
    
    stage('Build image') {
      steps{
        script {
          dockerImage = docker.build(dockerimagename, "--no-cache .")
        }
      }
    }
    stage('Pushing Image') {
      environment {
         // Ensure you have created this ID in Jenkins Credentials
         registryCredential = 'dockerhub-credentials'
      }
      steps{
        script {
          docker.withRegistry( 'https://registry.hub.docker.com', registryCredential ) {
            dockerImage.push("latest")
          }
        }
      }
    }
    stage('Deploying to Kubernetes') {
      steps {
        // This step wraps your commands with the credentials you uploaded
        withKubeConfig([credentialsId: kubeconfigId]) {
           sh 'kubectl apply -f deployment.yaml'
           sh 'kubectl apply -f service.yaml'
        }
      }
    }
  }
}