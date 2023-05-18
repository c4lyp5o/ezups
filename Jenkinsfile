pipeline {
    agent any

    environment {
        telegramBotToken = credentials('telegram-bot-token')
        telegramChatId = credentials('telegram-chat-id')
        ezupsAPIsalt = credentials('ezupsAPIsalt')
        ezupsAPIkey = credentials('ezupsAPIkey')
    }

    stages {
        stage('Informing through telegram') {
            steps {
                sh "curl -sS https://api.telegram.org/bot$telegramBotToken/sendMessage -d chat_id=$telegramChatId -d text='🔨 Building ${env.JOB_NAME} #${env.BUILD_NUMBER}...'"
            }
        }

        stage('Purge') {
            steps {
                echo 'Stopping container and removing current container..'
                sh "docker stop ezups || true && docker rm ezups || true"
                echo 'Done'
            }
        }

        stage('Prepare environment') {
            steps {
                echo 'Creating .env file...'
                writeFile file: '.env', text: """
                    DATABASE_URL="file:../db/ezups.db"
                    API_KEY="laailahaillaallah"
                    API_SALT="muhammadurrasulullah"
                    NEXT_PUBLIC_YOURNAME="Calypso"
                    NEXT_PUBLIC_API_HASH="ded80dbe3ce7cc38"
                """
                echo 'Done'
            }
        }

        stage('Build') {
            steps {
                echo 'Building new image..'
                sh "docker build . -t ezups"
                echo 'Done'
            }
        }

        stage('Deploy') {
            steps {
                echo 'Deploying....'
                sh "docker run -d -p 6555:3000 --name ezups --env-file .env ezups:latest"
                echo 'Done'
            }
        }
    }

    post {
        failure {
            script {
                def message = "❌ Build failed for ${env.JOB_NAME} #${env.BUILD_NUMBER}."
                sh "curl -sS https://api.telegram.org/bot$telegramBotToken/sendMessage -d chat_id=$telegramChatId -d text='${message}'"
            }
        }

        success {
            script {
                def prUrl = ''
                try {
                    def prNumber = sh(
                        script: 'git ls-remote --exit-code --heads origin "pull/*/head" | cut -d"/" -f3',
                        returnStdout: true
                    ).trim()
                    prUrl = "https://github.com/c4lyp5o/ezups/pull/${prNumber}"
                } catch (e) {
                    // Do nothing
                }
                def message = "✅ Build succeeded for ${env.JOB_NAME} #${env.BUILD_NUMBER}."
                if (prUrl != '') {
                    message += "\n🔗 PR: ${prUrl}"
                }
                sh "curl -sS https://api.telegram.org/bot$telegramBotToken/sendMessage -d chat_id=$telegramChatId -d text='${message}'"
            }
        }
    }
}
