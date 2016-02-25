# Logstash UI

This web interface allows you to handle your Logstash instances.

> **Note:**
  * Docker Remote API has to be enabled.

## How to get it?
#### From Dockerfile
```sh
$ docker build -t=charllie/logstash-ui .
```

#### From Docker Hub
```sh
$ docker pull charllie/logstash-ui:latest
```

## Get started

3 volumes are mounted :
* a `config` folder where are stored your *.conf files for Logstash
* a `data` folder where are stored your data (e.g: *.csv, *.json, ...)
* a `config.json` file

```sh
$ docker run --name=some-logstash-ui -d -v some-config-folder:/config -v some-data-folder:/data -v some-config.json:/root/server/config.json charllie/logstash-ui
```

## Configuration (`config.json`)

```json
{
  "docker": {
    "host": "$DOCKER_HOST",
    "port": "$DOCKER_PORT"
  },
  "folders": {
    "config": "some-config-folder",
    "data": "some-data-folder"
  }
}
```
