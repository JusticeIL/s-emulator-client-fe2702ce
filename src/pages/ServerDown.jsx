export default function ServerDown() {
  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-6">
      <div className="max-w-2xl w-full text-center space-y-8">
        <div className="space-y-4">
          <img 
            src="https://cdn.dribbble.com/users/77121/screenshots/2083086/media/783a488888c7672b6a6512d070f41da2.gif"
            alt="Caveman 404"
            className="mx-auto max-w-md w-full rounded-lg"
            onError={(e) => {
              e.target.style.display = 'none';
            }}
          />
          <h1 className="text-4xl font-bold text-foreground">Oops!</h1>
          <p className="text-xl text-muted-foreground">
            Looks like our server went on a prehistoric vacation.
          </p>
          <p className="text-lg text-muted-foreground">
            Please try again later.
          </p>
        </div>
      </div>
    </div>
  );
}
