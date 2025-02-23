import React, { useState, useEffect } from 'react';
import './App.css';
import Box from '@mui/material/Box';
import ActivityList from './components/ActivityList';
import RecordList from './components/RecordList';
import { createTheme, ThemeProvider } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import useMediaQuery from '@mui/material/useMediaQuery';
import { fetchRecords, fetchCategories } from './services/api';
import { ActiveActivityProvider } from './contexts/ActiveActivityContext';
import { GroupProvider } from './contexts/GroupContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { FilterProvider } from './contexts/FilterContext';
import { UIProvider } from './contexts/UIContext';

function App() {
    // カラーテーマ対応
    const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');
    const theme = React.useMemo(
        () =>
            createTheme({
                palette: {
                    mode: prefersDarkMode ? 'dark' : 'light',
                },
                breakpoints: {
                    values: {
                        xs: 0,
                        md: 1100
                    },
                },
            }),
        [prefersDarkMode]
    );

    const [records, setRecords] = useState([]);
    const [categories, setCategories] = useState([]);


    // 初回または更新時に最新のレコード一覧を取得する関数
    const updateRecords = async () => {
        try {
            const data = await fetchRecords();
            // 新しい配列の参照で更新
            setRecords([...data]);
        } catch (error) {
            console.error("Failed to fetch records:", error);
        }
    };

    // カテゴリ一覧を取得する関数
    const updateCategories = async () => {
        try {
            const data = await fetchCategories();
            setCategories([...data]);
        } catch (error) {
            console.error("Failed to fetch categories:", error);
        }
    };

    // 初回取得
    useEffect(() => {
        updateRecords();
        updateCategories();
    }, []);

    return (
        <ThemeProvider theme={theme}>
            <Box
                sx={{
                    width: '100%',
                    maxWidth: { xs: '800px', md: '980px' },
                    mx: 'auto',
                    px: 1,       // サイドパディング
                }}
            >
                <CssBaseline />
                <GroupProvider>
                    <CategoryProvider>
                        <UIProvider>
                            <FilterProvider>
                                <ActiveActivityProvider>
                                    <div>
                                        <h2>Activity Tracker</h2>
                                        <ActivityList onRecordUpdate={updateRecords} records={records} />
                                        <h2>History</h2>
                                        <RecordList records={records} categories={categories} onRecordUpdate={updateRecords} />
                                    </div>
                                </ActiveActivityProvider>
                            </FilterProvider>
                        </UIProvider>
                    </CategoryProvider>
                </GroupProvider>
            </Box>
        </ThemeProvider>
    );
}

export default App;