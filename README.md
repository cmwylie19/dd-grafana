# Prometheus Operator and Pepr

This deploys the prometheus manifests to the default namespace and is not intended for production, just as a means to show how to quickly scrape Pepr metrics. The [kube prometheus stack](https://github.com/prometheus-community/helm-charts/tree/main/charts/kube-prometheus-stack) provides a more production suitable way of deploying Prometheus in prod.


## Demo

Deploy Prometheus operator controller manager 

```plaintext
kubectl create -f https://raw.githubusercontent.com/prometheus-operator/prometheus-operator/main/bundle.yaml
```

 Create an instance of Prometheus 
 
```yaml
kubectl create -f -<<EOF
kind: Prometheus
apiVersion: monitoring.coreos.com/v1
metadata:
  name: k8s
  namespace: default
spec:
  serviceMonitorSelector: {}
  serviceMonitorNamespaceSelector: {}
  logLevel: debug
  logFormat: json
  replicas: 1
  image: quay.io/prometheus/prometheus:v2.35.0
  serviceAccountName: prometheus-operator
EOF
```

- Deploy your Pepr App -

By default, the prometheus service account does not have sufficient perms to `get/list/watch` the necessary Kubernetes resources. Create a clusterRole to allow scraping.   

```yaml
kubectl apply -f -<<EOF
apiVersion: rbac.authorization.k8s.io/v1
kind: ClusterRole
metadata:
  creationTimestamp: null
  name: scrape-resources
rules:
- apiGroups:
  - ""
  resources:
  - pods
  - pods/status
  - endpoints
  - services
  verbs:
  - list
  - get
  - watch
EOF
```

Assign the clusterRole to the Prometheus `serviceAccount`.   
  
```plaintext
kubectl create clusterrolebinding scrape-binding --clusterrole=scrape-resources --serviceaccount=default:prometheus-operator
```

Create a ServiceMonitors to scrape the `admission` and `watcher` controller services.   

```yaml
kubectl create -f -<<EOF
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: admission
spec:
  selector:
    matchLabels:
      pepr.dev/controller: admission
  namespaceSelector:
    matchNames:
    - pepr-system 
  endpoints:
  - targetPort: 3000
    scheme: https
    tlsConfig:
      insecureSkipVerify: true
---
apiVersion: monitoring.coreos.com/v1
kind: ServiceMonitor
metadata:
  name: watcher
  namespace: default
spec:
  selector:
    matchLabels:
      pepr.dev/controller: watcher
  namespaceSelector:
    matchNames:
    - pepr-system 
  endpoints:
  - targetPort: 3000 
    scheme: https
    tlsConfig:
      insecureSkipVerify: true
EOF
```

Port-forward to the Prometheus service and check out [targets](http://127.0.0.1:9090/targets).  
```plaintext
kubectl port-forward svc/prometheus-operated 9090
```
![Screenshot 2023-12-11 at 1 46 57 PM](https://gist.github.com/assets/1096507/a908d3fd-d47c-4b79-907f-ed5d3ee01d39)


