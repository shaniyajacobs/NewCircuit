import {React, useMemo} from 'react';
import HeaderBar from '../components/HeaderBar';
import primaryMixedLogo from '../images/Cir_Primary_RGB_Mixed White.PNG';
import { useNavigate } from 'react-router-dom';
import cirCrossPBlack from '../images/cir_cross_Black.svg';
import cirHeartPBlack from '../images/cir_heart_Black.svg';
import cirMinusPBlack from '../images/cir_minus_Black.svg';
import styled from 'styled-components';

function seededRandom(seed) {
    const x = Math.sin(seed++) * 10000;
    return x - Math.floor(x);
}

const FooterShapesBlack = () => {
    const SEED = 777;
    const rowCount = 8;
    const shapesPerRow = 12;

    const shapeOptions = [
        {src: cirCrossPBlack, alt: 'Cross' },
        { src: cirHeartPBlack, alt: 'Heart'},
        { src: cirMinusPBlack, alt: 'Minus'},
    ];

    const PatternContainer = styled.div`
        position: fixed;
        top: 0;
        left: 0;
        right: 0;
        bottom: 0;
        overflow: hidden;
        z-index: 0;
        pointer-events: none;
    `;

    const ShapeImage = styled.img`
        position: absolute;
        opacity: 1;
        user-select: none;
    `;

    const patternData = useMemo(() => {
        const grid = Array(rowCount).fill().map(() => Array(shapesPerRow).fill(shapeOptions[0]));
        const styles = Array(rowCount).fill().map((_, rowIndex) =>
            Array(shapesPerRow).fill().map((_, colIndex) => {
                const shapeSeed = SEED + (rowIndex * shapesPerRow + colIndex) * 10;
                return {
                    size: Math.floor(seededRandom(shapeSeed) * (80 - 25)) + 25,
                    blur: seededRandom(shapeSeed + 1) < 0.3 ? seededRandom(shapeSeed + 2) * 3 : 0,
                };
            })
        );

        for (let r = 0; r < rowCount; r++) {
            for (let c = 0; c < shapesPerRow; c++) {
                let possibilities = [...shapeOptions];

                if (c > 0) possibilities = possibilities.filter(p => p.src !== grid[r][c - 1].src);
                if (r > 0) possibilities = possibilities.filter(p => p.src !== grid[r - 1][c].src);
                if (possibilities.length === 0) possibilities = [...shapeOptions];

                const shapeSeed = SEED + (r * shapesPerRow + c) * 10 + 3;
                const randomIndex = Math.floor(seededRandom(shapeSeed) * possibilities.length);
                grid[r][c] = possibilities[randomIndex];
            }
        }

        return { grid, styles };
    }, [shapeOptions]);

    return (
        <PatternContainer>
            {patternData.grid.map((rowArray, row) =>
                rowArray.map((shape, col) => {
                    const spacing = 100 / (shapesPerRow - 1);
                    const horizontalOffset = (row % 2 === 1) ? spacing / 2 : 0;
                    let leftPercent = col * spacing + horizontalOffset;
                    if (leftPercent > 100) leftPercent = 100;

                    const style = patternData.styles[row][col];
                    const finalBottom = row * 30;

                    return (
                        <ShapeImage
                            key={`${row}-${col}`}
                            src={shape.src}
                            alt={shape.alt}
                            style={{
                                width: `${style.size}px`,
                                height: `${style.size}px`,
                                left: `${leftPercent}%`,
                                bottom: `${finalBottom}px`,
                                filter: `blur(${style.blur}px)`,
                                zIndex: row,
                            }}
                        />
                    );
                })
            )}
        </PatternContainer>
    );
};

const FinalQuizPage = () => {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen flex flex-col relative">
            <HeaderBar 
                showBack={true}
                logo={primaryMixedLogo}
                logoHeight="h-20"
                titleSize="text-4xl"
                className="w-full flex justify-center items-center text-center relative"
            />
            <div className="bg-[#8F3F3F3] flex-grow flex flex-col items-center justify-center px-8 relative">
                {/* <div className="absolute top-12 w-3/4 h-4 bg-[#1E40AF] rounded-full"></div> */}
                <div className="flex-grow flex flex-col justify-center items-center mb-4">
                    <h1 className="text-black text-4xl font-bold text-center mb-6">
                         <span className="text-[#1E40AF]">You’re all set!</span>
                    </h1>
                    <p className="text-xl text-center text-gray-700 max-w-2xl mb-12">
                    We’ll use your personality insights to help spark the best connections during your speed dates
                    </p>
                </div>
                <button 
                    onClick={() => navigate('/dashboard')}
                    className="mb-20 bg-[#0043F1] text-white px-8 py-4 rounded-xl text-xl font-semibold border-2 border-black shadow-md hover:bg-opacity-90 transition-all z-10 relative"
                >
                    Navigate to Dashboard
                </button>
            </div>
            <FooterShapesBlack />
        </div>
    );
};

export default FinalQuizPage;
