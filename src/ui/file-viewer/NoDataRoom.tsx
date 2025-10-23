export const NoDataRoom = () => {
  return (
    <div
      className="flex-1 flex items-center justify-center"
      data-testid="no-dataroom-message"
    >
      <div className="text-center space-y-2">
        <p className="text-lg font-medium text-muted-foreground">
          Please create your first data room
        </p>
        <p className="text-sm text-muted-foreground">
          Use the sidebar to create a new data room to get started
        </p>
      </div>
    </div>
  );
};
