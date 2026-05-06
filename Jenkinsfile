pipeline {
    agent any

    stages {

        stage('Clone Repository') {
            steps {
                git branch: 'main',
                url: 'https://github.com/ashish9753/DSA-Sheet-Backend.git'
            }
        }

        stage('Build Docker Image') {
            steps {
                bat 'docker build -t dsa-backend .'
            }
        }

        stage('Stop Old Container') {
            steps {
                bat 'docker stop dsa-container || exit 0'
                bat 'docker rm dsa-container || exit 0'
            }
        }

        stage('Run New Container') {
            steps {
                bat '''
                docker run -d ^
                -p 5000:5000 ^
                --name dsa-container ^
                dsa-backend
                '''
            }
        }
    }
}