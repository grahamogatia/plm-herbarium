import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function AddSpecimen() {
    const { currentUser } = useAuth();

    if (!currentUser) return null;

    return(
        <Button asChild variant="outline" size="sm" className="border-lime-200 text-lime-800 hover:bg-lime-50">
            <Link to="/collections/add-specimen">
                <Plus className="size-4" />
                Add Specimen
            </Link>
        </Button>
    )
};
export default AddSpecimen;
