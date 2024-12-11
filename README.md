# curio

## Local development
First, set up environment variables and secrets.
1. Copy `.env.template` to `.env` and populate values.

Download local development requirements:
1. [Tilt](https://docs.tilt.dev/install)
2. [Docker](https://docs.docker.com/engine/)
3. [Minikube](https://minikube.sigs.k8s.io/docs/start/)
4. [Kubectl](https://kubernetes.io/docs/tasks/tools/)

To start the local development environment:
1. Start a minikube cluster with `minikube start`.
2. Run `tilt up` to start the development cluster.
3. Navigate to `http://localhost:3000` to view the application.

## SSL certificates for the database
1. Generate database certificates:
   ```bash
   ./certs/generate-certs.sh
   ```
2. The certificates will be automatically applied by Tilt when you run `tilt up`

## Database shell
1. Run `kc exec -it deploy/db -- bash`.
2. Then, run `psql`.

To clear the database, run
1. `tilt down`
2. `minikube delete`