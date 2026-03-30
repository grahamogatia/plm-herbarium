import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function AddSpecimen() {
    const { currentUser } = useAuth();

    if (!currentUser) return null;

    return(
        <Button asChild variant="default" size="sm" className="bg-emerald-600 hover:bg-emerald-700 text-white">
            <Link to="/collections/add-specimen">
                <Plus className="size-4" />
                Add Specimen
            </Link>
        </Button>
    )
};
export default AddSpecimen;
