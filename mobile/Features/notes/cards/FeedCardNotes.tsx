import { notes } from "@/types/models";
import MyNotesFeedCard from "./MyNotes-feed";


type NotesFeedCardProps = {
    item: notes;
    pinned: boolean;
    onTogglePin: () => void;
    onDelete: () => void;
    onExpand: () => void;
    onEdit: () => void;
}


export default function NotesFeedCard({
    item,
    pinned,
    onTogglePin,
    onDelete,
    onExpand,
    onEdit,
}: NotesFeedCardProps) {

    return (
        <MyNotesFeedCard
            item={item}
            pinned={pinned}
            onExpand={onExpand}
            onEdit={onEdit}
            onTogglePin={onTogglePin}
            onDelete={onDelete}
        />
    );
}