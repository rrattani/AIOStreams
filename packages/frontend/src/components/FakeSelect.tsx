const FakeSelect: React.FC<
  Readonly<{
    innerText: string;
  }>
> = ({ innerText }) => {
  return (
    <div
      style={{
        height: '42px',
        margin: '0',
        backgroundColor: 'white',
        borderRadius: 'var(--borderRadius)',
        display: 'flex',
        alignItems: 'center',
      }}
    >
      <p style={{ margin: '10px', color: '#808090' }}>{innerText}</p>
    </div>
  );
};

export default FakeSelect;
