pipeline {
  agent none
  options {
    timeout(time: 1, unit: 'HOURS')
    timestamps()
    buildDiscarder(logRotator(numToKeepStr: '5', artifactNumToKeepStr: '5'))
    disableConcurrentBuilds()
  }

  environment {
    TMP = '/tmp'
    HOME = '/tmp/home'
    TMPDIR = '/tmp'

    // SLACK_CHANNEL = '#pixel-notifications'
    GIT_API_URL = 'https://git.corp.adobe.com/api/v3'
    DOCKER_IMAGE_NODEJS = 'node:14'

    GIT_CREDENTIALS = 'zolebot-gitcorp-authtoken'
    NPM_CREDENTIALS = 'zolebot-artifactory-npm-basicauth'
    SNITCH_CREDENTIALS = 'zolebot-snitch-token'
    SONAR_CREDENTIALS = 'aeftbot-sonarqube-token'
  }

  stages {
    stage ('Install NPM deps') {
      agent {
        docker { image DOCKER_IMAGE_NODEJS }
      }
      steps {
        // withCredentials([string(credentialsId: NPM_CREDENTIALS, variable: 'NPM_TOKEN')]) {
        withCredentials([usernamePassword(credentialsId: NPM_CREDENTIALS, usernameVariable: 'NPM_EMAIL', passwordVariable: 'NPM_AUTH')]) {
          sh('cp .npmrc.example .npmrc')
          sh('npm ci')
        }
        stash includes: 'node_modules/', name: 'node_modules'
      }
      post {
        always {
          sh('rm .npmrc')
          dir('node_modules') {
            deleteDir()
          }
        }
      }
    }

    stage ('Pre-Checks') {
      parallel {
        stage ('Check version') {
          when { changeRequest target: 'master' }
          agent {
            docker { image DOCKER_IMAGE_NODEJS }
          }
          steps {
            unstash 'node_modules'
            sh('npm run checkVersion')
          }
          post {
            always {
              dir('node_modules') {
                deleteDir()
              }
            }
            success {
              githubNotify(context: 'Version', description: 'Check the version number',  status: 'SUCCESS', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
            failure {
              githubNotify(context: 'Version', description: 'Check the version number',  status: 'FAILURE', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
          }
        }

        stage ('Lint code') {
          agent {
            docker { image DOCKER_IMAGE_NODEJS }
          }
          steps {
            unstash 'node_modules'
            sh('npm --no-update-notifier run lint')
          }
          post {
            always {
              dir('node_modules') {
                deleteDir()
              }
            }
            success {
              githubNotify(context: 'Lint code', description: 'Lint on source code',  status: 'SUCCESS', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
            failure {
              githubNotify(context: 'Lint code', description: 'Lint on source code',  status: 'FAILURE', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
          }
        }

        stage ('Run tests') {
          agent {
            docker { image 'circleci/node:latest-browsers' }
          }
          steps {
            unstash 'node_modules'
            sh('npm --no-update-notifier run test -- --headless')
            stash includes: 'reporting/coverage/report-lcov/lcov.info', name: 'sonar_coverage'
          }
          post {
            always {
              dir('node_modules') {
                deleteDir()
              }
              publishHTML target: [
                allowMissing: false,
                alwaysLinkToLastBuild: false,
                keepAll: true,
                reportDir: 'reporting/coverage/report-html',
                reportFiles: 'index.html',
                reportName: 'Test coverage report'
              ]
              junit 'reporting/test/test-results.xml'
            }
            success {
              githubNotify(context: 'Tests', description: 'Run tests',  status: 'SUCCESS', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
            failure {
              githubNotify(context: 'Tests', description: 'Run tests',  status: 'FAILURE', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
          }
        }

        stage('Vulnerability test on PR') {
          when { changeRequest target: 'master' }
          agent {
            docker { image DOCKER_IMAGE_NODEJS }
          }
          steps {
            unstash 'node_modules'
            withCredentials([string(credentialsId: SNITCH_CREDENTIALS, variable: 'TESSA2_API_KEY')]) {
              sh 'npm --no-update-notifier run tessa-check'
            }
          }
          post {
            always {
              dir('node_modules') {
                deleteDir()
              }
            }
            success {
              githubNotify(context: 'Vulnerability', description: 'Check new vulnerability',  status: 'SUCCESS', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
            failure {
              githubNotify(context: 'Vulnerability', description: 'Check new vulnerability',  status: 'FAILURE', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
          }
        }
      }
    }
    stage ('Build') {
      agent {
        docker { image DOCKER_IMAGE_NODEJS }
      }
      steps {
        unstash 'node_modules'
        sh('npm run build')
        stash includes: 'dist/', name: 'build'
      }
      post {
        always {
          dir('node_modules') {
            deleteDir()
          }
          archiveArtifacts artifacts: 'dist/**/*'
        }
        success {
          githubNotify(context: 'Build', description: 'Build artefact',  status: 'SUCCESS', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
        }
        failure {
          githubNotify(context: 'Build', description: 'Build artefact',  status: 'FAILURE', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
        }
      }
    }
    stage ('Extra') {
      parallel {
        stage ('Documentation') {
          agent {
            docker { image DOCKER_IMAGE_NODEJS }
          }
          steps {
            unstash 'node_modules'
            sh('npm --no-update-notifier run doc')
          }
          post {
            always {
              dir('node_modules') {
                deleteDir()
              }
              publishHTML target: [
                allowMissing: false,
                alwaysLinkToLastBuild: false,
                keepAll: true,
                reportDir: 'reporting/doc',
                reportFiles: 'index.html',
                reportName: 'Documentation'
              ]
            }
            success {
              githubNotify(context: 'Documentation', description: 'Generate documentation',  status: 'SUCCESS', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
            failure {
              githubNotify(context: 'Documentation', description: 'Generate documentation',  status: 'FAILURE', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
          }
        }
        stage ('SonarQube analysis') {
          when {
            anyOf {
              branch 'master';
              branch 'development';
            }
          }
          agent {
            docker { image DOCKER_IMAGE_NODEJS }
          }
          steps {
            unstash 'node_modules'
            unstash 'sonar_coverage'
            withCredentials([string(credentialsId: SONAR_CREDENTIALS, variable: 'SONAR_TOKEN')]) {
              sh('npm run sonarQube')
            }
          }
          post {
            always {
              dir('node_modules') {
                deleteDir()
              }
            }
            success {
              githubNotify(context: 'SonarQube', description: 'SonarQube analysis',  status: 'SUCCESS', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
            failure {
              githubNotify(context: 'SonarQube', description: 'SonarQube analysis',  status: 'FAILURE', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
          }
        }
      }
    }

    stage ('Deploy') {
      parallel {
        stage('Snitch publish') {
          when {
            branch 'master'
          }
          agent {
            docker { image DOCKER_IMAGE_NODEJS }
          }
          steps {
            unstash 'node_modules'
            withCredentials([string(credentialsId: SNITCH_CREDENTIALS, variable: 'TESSA2_API_KEY')]) {
              sh 'npm --no-update-notifier run tessa-push'
            }
          }
          post {
            always {
              dir('node_modules') {
                deleteDir()
              }
            }
            success {
              githubNotify(context: 'Snitch update', description: 'Publish product dependency',  status: 'SUCCESS', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
            failure {
              githubNotify(context: 'Snitch update', description: 'Publish product dependency',  status: 'FAILURE', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
          }
        }
        stage ('Artifactory') {
          when {
            branch 'master'
          }
          agent {
            docker { image DOCKER_IMAGE_NODEJS }
          }
          steps {
            // withCredentials([string(credentialsId: NPM_CREDENTIALS, variable: 'NPM_TOKEN')]) {
            withCredentials([usernamePassword(credentialsId: NPM_CREDENTIALS, usernameVariable: 'NPM_EMAIL', passwordVariable: 'NPM_AUTH')]) {
              unstash 'node_modules'
              unstash 'build'
              sh('cp .npmrc.example .npmrc')
              sh('npm run multiPublish')
            }
          }
          post {
            always {
              sh('rm .npmrc')
              dir('node_modules') {
                deleteDir()
              }
            }
            success {
              githubNotify(context: 'Artifactory', description: 'Publish artefact into artifactory',  status: 'SUCCESS', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
            failure {
              githubNotify(context: 'Artifactory', description: 'Publish artefact into artifactory',  status: 'FAILURE', gitApiUrl: GIT_API_URL, credentialsId: GIT_CREDENTIALS)
            }
          }
        }
      }
    }
  }
  // post {
  //   success {
  //     slackSend (color: '#00FF00', channel: SLACK_CHANNEL, message: "${env.JOB_NAME}: Succeed Build #${env.BUILD_NUMBER} (<${env.RUN_DISPLAY_URL}|Open>)")
  //   }
  //   failure {
  //     slackSend (color: '#FF0000', channel: SLACK_CHANNEL, message: "${env.JOB_NAME}: Failed Build #${env.BUILD_NUMBER} (<${env.RUN_DISPLAY_URL}|Open>)")
  //   }
  // }
}
