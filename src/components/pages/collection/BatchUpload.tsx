import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function BatchUpload() {
    const { currentUser } = useAuth();

    if (!currentUser) return null;

    return (
        <Button asChild variant="outline" size="sm" className="border-lime-200 text-lime-800 hover:bg-lime-50">
            <Link to="/collections/batch-upload">
                <Upload className="size-4" />
            </Link>
        </Button>
    );
}

export default BatchUpload;
