import React, { useEffect, useMemo } from 'react';
import TextField from '@mui/material/TextField';
import MenuItem from '@mui/material/MenuItem';
import IconButton from '@mui/material/IconButton';
import { Box } from '@mui/material';
import ClearIcon from '@mui/icons-material/Clear';
import { useFilter } from '../contexts/FilterContext';

function RecordFilter({ onFilterChange, records }) {
    const { filterState, setFilterState } = useFilter();
    const { groupFilter, activityNameFilter } = filterState;

    // グループ選択に応じた項目の選択肢
    const filteredActivityNames = useMemo(() => {
        let recs;
        if (groupFilter) {
            // グループが選択されている場合は、そのグループに属するレコードを抽出
            recs = records.filter(rec => String(rec.activity_group) === groupFilter);
        } else {
            recs = records;
        }
        // records からユニークな activity_name を抽出
        let names = Array.from(new Set(recs.map(rec => rec.activity_name)));
        // 現在の activityNameFilter が空でなく、リストに含まれていなければ追加する
        if (activityNameFilter && !names.includes(activityNameFilter)) {
            names.push(activityNameFilter);
        }
        return names;
    }, [records, groupFilter, activityNameFilter]);

    // フィルター状態の変更を onFilterChange に通知
    useEffect(() => {
        onFilterChange(filterState);
    }, [filterState, onFilterChange]);

    // リセットボタン用のハンドラー
    const handleReset = () => {
        setFilterState(prev => ({
            ...prev,
            activityNameFilter: ``,
        }));
    };

    return (
        <Box sx={{ mb: 2 }}>
            <TextField
                label="Activity"
                select
                size='small'
                value={activityNameFilter}
                onChange={(e) => {
                    setFilterState(prev => ({ ...prev, activityNameFilter: e.target.value }));
                }}
                sx={{ minWidth: 180 }}
            >
                <MenuItem value="">All</MenuItem>
                {filteredActivityNames.map((name, idx) => (
                    <MenuItem key={idx} value={name}>
                        {name}
                    </MenuItem>
                ))}
            </TextField>
            {activityNameFilter != `` && (
                <IconButton onClick={handleReset}>
                    <ClearIcon />
                </IconButton>
            )}
        </Box>
    );
}

export default RecordFilter;