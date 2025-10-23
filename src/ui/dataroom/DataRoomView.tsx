import { useEffect, useMemo } from "react";
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/lib/auth/use-auth";
import { useDataRooms } from "@/lib/hooks/dataroom";
import { useDataRoomUIStore } from "@/state/ui/dataroom-ui";
import { Breadcrumbs } from "@/ui/breadcrumbs/Breadcrumbs";
import { FileViewer } from "@/ui/file-viewer/FileViewer";

export const DataRoomView = () => {
  const { dataRoomId } = useParams<{ dataRoomId?: string }>();
  const location = useLocation();
  const navigate = useNavigate();
  const { user } = useAuth();
  const userId = user?.id || "";

  const folderPath = useMemo(() => {
    const match = location.pathname.match(/^\/dataroom\/[^/]+\/folder\/(.+)$/);
    return match?.[1] ?? null;
  }, [location.pathname]);

  const folderId = useMemo(() => {
    if (!folderPath) return null;
    const folderSegments = folderPath.split("/");
    return folderSegments[folderSegments.length - 1];
  }, [folderPath]);

  const { data: dataRooms } = useDataRooms(userId);
  const setCurrentDataRoomId = useDataRoomUIStore(
    (state) => state.setCurrentDataRoomId,
  );
  const setSelectedNodeId = useDataRoomUIStore(
    (state) => state.setSelectedNodeId,
  );

  useEffect(() => {
    if (!dataRooms || dataRooms.length === 0) {
      setCurrentDataRoomId(null);
      setSelectedNodeId(null);
      return;
    }

    if (!dataRoomId) {
      navigate(`/dataroom/${dataRooms[0].id}`, { replace: true });
      return;
    }

    if (dataRoomId) {
      const roomExists = dataRooms.some((room) => room.id === dataRoomId);
      if (!roomExists) {
        navigate(`/dataroom/${dataRooms[0].id}`, { replace: true });
        return;
      }

      setCurrentDataRoomId(dataRoomId);
      setSelectedNodeId(folderId);
    }
  }, [
    dataRoomId,
    dataRooms,
    folderId,
    navigate,
    setCurrentDataRoomId,
    setSelectedNodeId,
  ]);

  return (
    <>
      <Breadcrumbs />
      <FileViewer />
    </>
  );
};
