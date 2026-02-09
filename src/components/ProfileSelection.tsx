import HeroSection from '@/components/landing/HeroSection';
import ImageGallery from '@/components/landing/ImageGallery';
import CompanySection from '@/components/landing/CompanySection';
import LeadershipSection from '@/components/landing/LeadershipSection';

const ProfileSelection = () => {
  return (
    <div className="min-h-screen">
      <HeroSection />
      <ImageGallery />
      <CompanySection />
      <LeadershipSection />
    </div>
  );
};

export default ProfileSelection;
