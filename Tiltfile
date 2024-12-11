load('ext://namespace', 'namespace_create')
namespace_create('default')

load('ext://dotenv', 'dotenv')
dotenv()

os.environ['CERT_DIR'] = os.path.abspath('certs')

def inject_env_vars(yaml_str):
    env_map = {k: str(v) for k, v in os.environ.items()}
    for key, value in env_map.items():
        yaml_str = yaml_str.replace('${' + key + '}', value)
        yaml_str = yaml_str.replace('$' + key, value)
    return yaml_str

def apply_k8s_yaml(file_path, allow_duplicates=False):
    yaml_content = str(read_file(file_path))
    processed_yaml = inject_env_vars(yaml_content)
    k8s_yaml(blob(processed_yaml), allow_duplicates=allow_duplicates)

apply_k8s_yaml('k8s/kong-configmap.yaml')
apply_k8s_yaml('k8s/db-cm0-configmap.yaml')
apply_k8s_yaml('k8s/db-cm1-configmap.yaml')
apply_k8s_yaml('k8s/db-cm2-configmap.yaml')
apply_k8s_yaml('k8s/db-cm3-configmap.yaml')
apply_k8s_yaml('k8s/db-cm5-configmap.yaml')
apply_k8s_yaml('k8s/db-config-configmap.yaml')
apply_k8s_yaml('k8s/vector-configmap.yaml')
apply_k8s_yaml('k8s/db-data-volume.yaml', allow_duplicates=True)
apply_k8s_yaml('k8s/storage-data-volume.yaml', allow_duplicates=True)
apply_k8s_yaml('k8s/db-certs-secret.yaml')

for service in ['analytics-service.yaml', 'db-service.yaml', 'kong-service.yaml']:
    apply_k8s_yaml('k8s/' + service)

apply_k8s_yaml('k8s/vector-rbac.yaml')

deployment_files = [
    'k8s/analytics-deployment.yaml',
    'k8s/auth-deployment.yaml',
    'k8s/db-deployment.yaml',
    'k8s/imgproxy-deployment.yaml',
    'k8s/kong-deployment.yaml',
    'k8s/meta-deployment.yaml',
    'k8s/realtime-deployment.yaml',
    'k8s/rest-deployment.yaml',
    'k8s/storage-deployment.yaml',
    'k8s/studio-deployment.yaml',
    'k8s/vector-deployment.yaml',
    'k8s/web-deployment.yaml'
]

for f in deployment_files:
    apply_k8s_yaml(f)

k8s_resource('db',
    labels=['database'],
    port_forwards=['5432:5432'],
    trigger_mode=TRIGGER_MODE_AUTO,
)

k8s_resource('vector',
    labels=['supabase'],
    resource_deps=['db'],
    extra_pod_selectors=[{'app': 'vector'}],
    objects=[
        'vector:ServiceAccount:default',
        'vector:ClusterRole:default',
        'vector:ClusterRoleBinding:default'
    ]
)

k8s_resource('analytics',
    resource_deps=['db'],
    port_forwards=['4000:4000'],
    labels=['supabase'])
k8s_resource('auth', resource_deps=['db', 'analytics'], labels=['supabase'])
k8s_resource('imgproxy', resource_deps=['storage'], labels=['supabase'])
k8s_resource('meta', resource_deps=['db'], labels=['supabase'])
k8s_resource('realtime', resource_deps=['db'], labels=['supabase'])
k8s_resource('rest', resource_deps=['db'], labels=['supabase'])
k8s_resource('storage',
    resource_deps=['db', 'rest'],
    port_forwards=['5000:5000'],
    labels=['supabase'])
k8s_resource('kong',
    resource_deps=['auth', 'rest', 'storage'],
    port_forwards=['8000:8000', '8443:8443'],
    labels=['supabase'])
k8s_resource('studio', resource_deps=['meta', 'analytics', 'kong'], labels=['supabase'])