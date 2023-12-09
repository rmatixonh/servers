import {
  Deployment,
  EnvValue,
  Ingress,
  IngressBackend,
  Service,
} from "npm:cdk8s-plus-27";
import { ApiObject, Chart, JsonPatch } from "npm:cdk8s";

export function createInvidiousDeployment(chart: Chart) {
  const postgresDeployment = new Deployment(chart, "postgres", {
    replicas: 1,
  });

  postgresDeployment.addContainer({
    image: "postgres",
    portNumber: 5432,
    envVariables: {
      POSTGRES_PASSWORD: EnvValue.fromValue("password"),
      POSTGRES_DB: EnvValue.fromValue("invidious"),
    },
    securityContext: {
      ensureNonRoot: false,
      readOnlyRootFilesystem: false,
    },
    resources: {},
  });

  const postgresService = postgresDeployment.exposeViaService();

  const invidiousDeployment = new Deployment(chart, "invidious", {
    replicas: 1,
  });

  invidiousDeployment.addContainer({
    image: "quay.io/invidious/invidious",
    envVariables: {
      INVIDIOUS_CONFIG: EnvValue.fromValue(`
db:
  dbname: invidious
  user: postgres
  password: password
  host: ${postgresService.name}
  port: 5432
check_tables: true
hmac_key: "rVA6+87s6d8 7f56S4A6S5Df46 advs"
    `),
    },
    portNumber: 3000,
    securityContext: {
      ensureNonRoot: false,
      readOnlyRootFilesystem: false,
    },
    resources: {},
  });

  postgresDeployment.connections.allowFrom(invidiousDeployment);

  const service = new Service(chart, "invidious-service", {
    selector: invidiousDeployment,
    ports: [{ port: 3000 }],
  });

  const ingress = new Ingress(chart, "invidious-ingress", {
    defaultBackend: IngressBackend.fromService(service),
    tls: [
      {
        hosts: ["invidious"],
      },
    ],
  });

  ApiObject.of(ingress).addJsonPatch(
    JsonPatch.add("/spec/ingressClassName", "tailscale")
  );
}