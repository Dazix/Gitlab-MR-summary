<img align="left" width="60" height="60" src="images/readme/icon.png">

# Gitlab MR summary extension

Do you know the feeling when you start using a new service but want some features from the old one? I had this feeling when we started using Gitlab in HeurekaDevs after some time when we were using Bitbucket Stash and found that Gitlab has no summary of waiting MRs for codereview, as Stash had. Yes, there are TODOs but they behave strangely and illogically so I decided to write this extension.

### How it works
Extension uses Gitlab API for getting all required data about projects and theirs MR requests and participants. Gitlab API is read/write and unfortunetly you can't restrict your tokens only for read access. But don't worry **extension only reads data**.

### Setup
1. Get extension for your browser
    - for [chrome](https://chrome.google.com/webstore/detail/gitlab-mr-summary/gekiikmjljplpkcmheahicdcbblkafki)
    - for [firefox](https://addons.mozilla.org/cs/firefox/addon/gitlab-mr-summary/)
2. Set options of your Gitlab
    <img align="right" width="320" height="167" src="images/readme/settings.png">
    - for auth you can use 
        - [private access token](https://docs.gitlab.com/ee/user/profile/personal_access_tokens.html)
        - [OAuth2](https://docs.gitlab.com/ee/integration/oauth_provider.html)
            - redirect URI displays when you check this option
            - OAuth flow pops up when you first come to entered Gitlab domain
3. Go to your Gitlab domain and profit!
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
