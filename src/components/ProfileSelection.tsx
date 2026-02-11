import HeroSection from '@/components/landing/HeroSection';
import ImageGallery from '@/components/landing/ImageGallery';
import CompanySection from '@/components/landing/CompanySection';
import LeadershipSection from '@/components/landing/LeadershipSection';

const ProfileSelection = () => {
  return (
    <div className="min-h-screen">
      {/* 1. Hero Section */}
      <HeroSection />
      {/* 2. Operations (Image Gallery) */}
      <ImageGallery />
      {/* 3. About Us */}
      <CompanySection />
      {/* 4. Four Profile Cards — included in HeroSection */}
      {/* 5. Proprietor Section */}
      <LeadershipSection />
      {/* 6. Footer — included in LeadershipSection */}
    </div>
  );
};

export default ProfileSelection;
