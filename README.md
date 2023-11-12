# Installation

1. Install k3s.

    ```
    curl -sfL https://get.k3s.io | sh -
    ```

    * Configure:

    ```
    rm -rfv ~/.kube && mkdir ~/.kube && sudo cp /etc/rancher/k3s/k3s.yaml ~/.kube/config && sudo chown $USER:$USER ~/.kube/config && chmod 600 ~/.kube/config
    ```

1. Install `helm` and `argocd`.

    ```
    brew install helm argocd
    ```

1. Install argocd.

    ```
    kubectl create namespace argocd
    kubectl apply -n argocd -f https://raw.githubusercontent.com/argoproj/argo-cd/stable/manifests/install.yaml
    ```

1. Port-forward argocd to access the UI.

    ```
    kubectl port-forward svc/argocd-server -n argocd 8080:443 --address 0.0.0.0
    ```

1. Get the initial Argo CD `admin` password.

    ```
    argocd admin initial-password -n argocd
    ```

1. Go to the Argo CD UI at `http://<host>:8080`. Change the `admin` password.

1. Add `apps/` directory in this repository to argocd.
1. Sync the `argocd` application, but not any others.
1. Set the credentials in the `manual` directory. Create these resources using `kubectl apply`.

    * These should be the only credentials that are manually set. Everything else can be retrieved from 1Password.

1. Sync the 1Password application.
1. Sync the Tailscale application.
