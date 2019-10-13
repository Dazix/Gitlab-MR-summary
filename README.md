<img align="left" width="60" height="60" src="images/readme/icon.png">

# Gitlab MR summary extension

Do you know the feeling when you start using a new service but want some features from the old one? I had a feeling when we started using Gitlab in HeurekaDevs after some time when we were using Bitbucket Stash and found that Gitlab had no summary of waiting MRs for codereview, as Stash has. So I decided to write this extension.

### Setup
1. get extension 
    - for [chrome](https://chrome.google.com/webstore/detail/gitlab-mr-summary/gekiikmjljplpkcmheahicdcbblkafki)
    - for firefox coming soon
2. Set options of your Gitlab
<img align="right" width="320" height="167" src="images/readme/settings.png">
  
- you can use 
    - [private access token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
    - [OAuth2](https://docs.gitlab.com/ee/integration/oauth_provider.html)
        - redirect URI displays when you check this option
        - OAuth flow pops up when you first come to entered Gitlab domain
3. Go to your Gitlab domain
<p align="center">
  <img width="640" height="400" src="images/readme/preview.png">
</p>



### Develop
Run watch task 
```shell script
$ docker build . -t gitlab-mr-summary
$ docker run -v $(pwd):/app -ti --rm gitlab-mr-summary npm run develop
```
Pack extension to zip file for distributing
```shell script
$ docker build . -t gitlab-mr-summary
$ docker run -v $(pwd):/app -ti --rm gitlab-mr-summary npm run pack
```
