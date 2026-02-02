import FullScreen from "@/components/layout/FullScreen";
import { TypographyH1 } from "@/components/ui/typography/typographyH1";

function Home() {
    return (
        <div>
            <FullScreen title="Welcome">
                <TypographyH1>PLM Botanical Herbarium</TypographyH1>
            </FullScreen>
            <FullScreen title="Welcome">
                <div>test</div>
            </FullScreen>
            <FullScreen title="Welcome">
                <div>test</div>
            </FullScreen>
        </div>
    );
}

export default Home;