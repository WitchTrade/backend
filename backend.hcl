job "witchtrade-be" {
  datacenters = ["dc1"]
  type        = "service"

  group "witchtrade" {
    count = 1

    network {
       port "http" {
         to = 3001
         host_network = "public"
       }
    }

    service {
      name = "witchtrade-be"
      port = "http"
      provider = "nomad"

      tags = [
        "traefik.enable=true",
        "traefik.http.routers.wtbe.rule=Host(`witchtrade.org`)&&PathPrefix(`/api`)",
        "traefik.http.routers.wtbe.tls.certresolver=letsencrypt",
      ]
    }

    task "server" {
      driver = "docker"

      resources {
        cpu = 300
        memory = 300
      }

      template {
        data = <<EOH
          {{ range nomadService "witchtrade-db" }}
            DATABASEHOST="{{ .Address }}"
            STATS_DATABASEHOST="{{ .Address }}"
          {{ end }}
        EOH
        destination = "/env.env"
        env = true
      }

      env {
        DATABASEUSER = "USER"
        DATABASEPW = "PASSWORD"
        DATABASEPORT = "5432"
        STATS_DATABASEUSER = "USER"
        STATS_DATABASEPW = "PASSWORD"
        STATS_DATABASEPORT = "5432"
        SECRET = "SECRET"
        REFRESHSECRET = "SECRET"
        GAMESERVERCACHETIME = "10000"
        STEAMINVCACHETIME = "1800000"
        STEAMAPIKEY = "KEY"
        STEAM_REALM = "https://witchtrade.org"
        STEAM_RETURNURL = "https://witchtrade.org/user/settings/account"
        STEAMMASTERSERVER = "hl2master.steampowered.com:27011"
        WITCHITAPPID = "559650"
        QUEST_CACHETIME = "300000"
        QUEST_ENDPOINT ="ENDPOINT"
        QUEST_AUTH_TOKEN = "TOKEN"
        USER_AGENT = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/107.0.0.0 Safari/537.36"
      }

      config {
        image = "ghcr.io/witchtrade/backend"
        ports = ["http"]
      }
    }
  }
}
