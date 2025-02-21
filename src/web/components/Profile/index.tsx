interface ProfileProps {
  username: string;
}

const Profile: React.FC<ProfileProps> = ({ username }: ProfileProps) => {
  return <div>Profile {username}</div>;
};

export default Profile;
