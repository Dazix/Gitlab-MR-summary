# Gitlab MR summary extension

### Develop
```shell script
docker build . -t gitlab-mr-summary
docker run -v $(pwd):/app -ti --rm gitlab-mr-summary npm run develop
```

### Pack extension
```shell script
docker build . -t gitlab-mr-summary
docker run -v $(pwd):/app -ti --rm gitlab-mr-summary npm run pack
```
