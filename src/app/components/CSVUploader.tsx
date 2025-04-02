"use client";

import { useState } from "react";
import Papa from "papaparse";
import {
  Box,
  Typography,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Button,
  Collapse,
} from "@mui/material";

const bankMappings: Record<string, any> = {
  usbank: {
    date: "Date",
    amount: "Amount",
    description: "Memo",
    vendor: "Name",
    transaction_type: "Transaction",
  },
  disneycard: {
    date: "Transaction Date",
    amount: "Amount",
    description: "Memo",
    vendor: "Description",
    transaction_type: "Type",
  },
  fidelity: {
    date: "Run Date",
    amount: "Amount ($)",
    description: "Description",
    vendor: "Action",
    transaction_type: "Type",
  },
};

export default function CSVUploader() {
  const [selectedBank, setSelectedBank] = useState<string>("usbank");
  const [open, setOpen] = useState<boolean>(false);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const mapping = bankMappings[selectedBank];

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data as any[];

        const normalized = rows
          .filter((row) => {
            const txType = row[mapping.transaction_type];
            const txVendor = row[mapping.vendor];
            const amount = parseFloat(row[mapping.amount]);

            if (selectedBank === "usbank")
              return (
                txType?.toLowerCase() === "debit" ||
                txVendor?.toLowerCase() === "check"
              );
            if (selectedBank === "disneycard")
              return txType?.toLowerCase() === "sale";
            if (selectedBank === "fidelity") return amount < 0;
            return true;
          })
          .map((row) => ({
            date: formatToISODate(row[mapping.date]),
            amount: parseFloat(row[mapping.amount]),
            description: row[mapping.description],
            vendor:
              row[mapping.vendor].toLowerCase() === "check"
                ? "Check #" + row[mapping.transaction_type]
                : row[mapping.vendor],
            transaction_type: row[mapping.transaction_type],
            source_bank: selectedBank,
          }));
        console.log("normalized", normalized);
        const res = await fetch("/api/import-csv", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ records: normalized }),
        });

        const json = await res.json();
        alert(`${json.inserted || 0} rows imported.`);
        setOpen(false); // collapse on success
      },
    });
  };

  const formatToISODate = (input: string) => {
    if (!input) return null;
    const partsHyphen = input.trim().split("-");
    if (partsHyphen.length === 3) return input;
    const parts = input.trim().split("/");
    if (parts.length !== 3) return null;
    const [month, day, year] = parts.map((p) => p.trim());
    return `${year}-${month.padStart(2, "0")}-${day.padStart(2, "0")}`;
  };

  return (
    <Box mt={4}>
      <Button variant='outlined' onClick={() => setOpen((prev) => !prev)}>
        {open ? "Cancel" : "Upload CSV File"}
      </Button>

      <Collapse in={open}>
        <Box mt={2} display='flex' flexDirection='column' gap={2}>
          <FormControl fullWidth>
            <InputLabel id='bank-label'>Select Bank</InputLabel>
            <Select
              labelId='bank-label'
              value={selectedBank}
              onChange={(e) => setSelectedBank(e.target.value)}
              label='Select Bank'
            >
              <MenuItem value='usbank'>USBank</MenuItem>
              <MenuItem value='disneycard'>Disney Card</MenuItem>
              <MenuItem value='fidelity'>Fidelity</MenuItem>
            </Select>
          </FormControl>

          <Button variant='contained' component='label'>
            Upload CSV
            <input
              type='file'
              accept='.csv'
              hidden
              onChange={handleFileUpload}
            />
          </Button>
        </Box>
      </Collapse>
    </Box>
  );
}
