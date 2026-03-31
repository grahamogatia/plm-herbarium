import { Button } from "@/components/ui/button";
import { Upload } from "lucide-react";
import { Link } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";

function BatchUpload() {
    const { currentUser } = useAuth();

    if (!currentUser) return null;

    return (
        <Button asChild variant="outline" size="sm">
            <Link to="/collections/batch-upload">
                <Upload className="size-4" />
            </Link>
        </Button>
    );
}

export default BatchUpload;
