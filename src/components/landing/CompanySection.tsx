const CompanySection = () => {
  return (
    <section className="py-16 md:py-24" style={{ background: 'white' }}>
      <div className="max-w-4xl mx-auto px-4">
        <div className="text-center mb-10">
          <p className="text-sm font-semibold tracking-widest uppercase mb-2" style={{ color: '#94a3b8' }}>About Us</p>
          <h2 className="text-3xl md:text-4xl font-extrabold" style={{ color: '#0f172a' }}>
            Powering Growth Since 2021
          </h2>
          <div className="w-16 h-1 mx-auto mt-4 rounded-full" style={{ background: '#f97316' }} />
        </div>
        <div className="max-w-3xl mx-auto text-center">
          <p className="leading-relaxed text-base md:text-lg" style={{ color: '#475569' }}>
            Tibrewal & Tibrewal Pvt. Ltd. is a prominent business group based in Jharkhand, 
            operating across mining, stone crushing, transportation, petroleum distribution, and tyre trading. 
            With a commitment to quality and reliability, we have established ourselves as a trusted name in 
            the region's industrial landscape. Our integrated operations span across multiple verticals, 
            serving the growing infrastructure needs of Eastern India.
          </p>
        </div>
      </div>
    </section>
  );
};

export default CompanySection;
