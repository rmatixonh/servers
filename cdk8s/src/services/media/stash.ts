import {
  Deployment,
  DeploymentStrategy,
  EnvValue,
  Service,
  Volume,
} from "npm:cdk8s-plus-27";
import { ApiObject, Chart, JsonPatch } from "npm:cdk8s";
import { withCommonLinuxServerProps } from "../../utils/linuxserver.ts";
import { LonghornVolume } from "../../utils/longhorn.ts";
import { TailscaleIngress } from "../../utils/tailscale.ts";

export function createStashDeployment(chart: Chart) {
  const deployment = new Deployment(chart, "stash", {
    replicas: 1,
    strategy: DeploymentStrategy.recreate(),
  });

  const longhornVolumeData = new LonghornVolume(chart, "stash-data", {});
  const longhornVolumeGenerated = new LonghornVolume(
    chart,
    "stash-generated",
    {},
  );
  const longhornVolumeMetadata = new LonghornVolume(
    chart,
    "stash-metadata",
    {},
  );
  const longhornVolumeBlobs = new LonghornVolume(
    chart,
    "stash-blobs",
    {},
  );
  const longhornVolumeConfig = new LonghornVolume(
    chart,
    "stash-config",
    {},
  );

  deployment.addContainer(
    withCommonLinuxServerProps({
      image: "stashapp/stash",
      portNumber: 9999,
      envVariables: {
        NVIDIA_DRIVER_CAPABILITIES: EnvValue.fromValue("all"),
        NVIDIA_VISIBLE_DEVICES: EnvValue.fromValue("all"),
      },
      volumeMounts: [
        {
          path: "/data",
          volume: Volume.fromPersistentVolumeClaim(
            chart,
            "stash-data-volume",
            longhornVolumeData.claim,
          ),
        },
        {
          path: "/generated",
          volume: Volume.fromPersistentVolumeClaim(
            chart,
            "stash-generated-volume",
            longhornVolumeGenerated.claim,
          ),
        },
        {
          path: "/metadata",
          volume: Volume.fromPersistentVolumeClaim(
            chart,
            "stash-metadata-volume",
            longhornVolumeMetadata.claim,
          ),
        },
        {
          path: "/blobs",
          volume: Volume.fromPersistentVolumeClaim(
            chart,
            "stash-blobs-volume",
            longhornVolumeBlobs.claim,
          ),
        },
        {
          path: "/root/.stash",
          volume: Volume.fromPersistentVolumeClaim(
            chart,
            "stash-config-volume",
            longhornVolumeConfig.claim,
          ),
        },
        {
          volume: Volume.fromHostPath(
            chart,
            "stash-secret-bind-mount",
            "stash-secret-bind-mount",
            {
              path: "/mnt/storage/media/secret",
            },
          ),
          path: "/data/secret",
        },
      ],
    }),
  );

  const service = new Service(chart, "stash-service", {
    selector: deployment,
    ports: [{ port: 9999 }],
  });

  new TailscaleIngress(chart, "stash-tailscale-ingress", {
    service,
    host: "stash",
  });

  ApiObject.of(deployment).addJsonPatch(
    JsonPatch.add("/spec/template/spec/runtimeClassName", "nvidia"),
  );
}
